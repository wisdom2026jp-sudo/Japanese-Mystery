/**
 * youtubeUploadService.ts
 * YouTube Data API v3 - OAuth 2.0 (Implicit Token Flow via GIS)
 */

const SCOPES = 'https://www.googleapis.com/auth/youtube.upload';
const CLIENT_ID = (import.meta as any).env?.VITE_YOUTUBE_CLIENT_ID || '';

let accessToken: string | null = null;

export function getAccessToken(): string | null { return accessToken; }
export function clearAccessToken(): void { accessToken = null; }

/** Google Identity Services 동적 로드 */
function loadGisScript(): Promise<void> {
    if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
    return new Promise((resolve, reject) => {
        if (document.getElementById('gis-script')) {
            // 이미 로드 중 - 완료 대기
            const wait = setInterval(() => {
                if ((window as any).google?.accounts?.oauth2) {
                    clearInterval(wait);
                    resolve();
                }
            }, 100);
            setTimeout(() => { clearInterval(wait); reject(new Error('GIS 로드 타임아웃')); }, 10000);
            return;
        }
        const s = document.createElement('script');
        s.id = 'gis-script';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Google Identity Services 로드 실패. 인터넷 연결을 확인하세요.'));
        document.head.appendChild(s);
    });
}

/**
 * OAuth 2.0 팝업 인증 → access token 반환
 *
 * ⚠️ redirect_uri_mismatch 오류 해결:
 * Google Cloud Console → APIs & Services → Credentials → OAuth 클라이언트 ID
 * "Authorized JavaScript origins"에 아래 추가:
 *   http://localhost:4000
 *   http://localhost:4001
 *   http://localhost:4002
 */
export async function authorizeYouTube(): Promise<string> {
    await loadGisScript();

    if (!CLIENT_ID) {
        throw new Error(
            'VITE_YOUTUBE_CLIENT_ID가 설정되지 않았습니다.\n' +
            '.env.local 파일에 VITE_YOUTUBE_CLIENT_ID=xxx 를 추가하세요.'
        );
    }

    return new Promise((resolve, reject) => {
        try {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp: any) => {
                    if (resp.error) {
                        // access_denied: 테스트 사용자 미등록
                        if (resp.error === 'access_denied') {
                            reject(new Error(
                                '❌ 액세스 거부됨\n\n' +
                                'Google Cloud Console → OAuth 동의 화면 → 테스트 사용자에\n' +
                                'wisdom2026jp@gmail.com 을 추가하세요.'
                            ));
                        } else {
                            reject(new Error(`OAuth 오류: ${resp.error} (${resp.error_description || ''})`));
                        }
                        return;
                    }
                    accessToken = resp.access_token;
                    resolve(resp.access_token);
                },
                error_callback: (err: any) => {
                    if (err?.type === 'popup_closed') {
                        reject(new Error('로그인 팝업이 닫혔습니다. 다시 시도해주세요.'));
                    } else if (err?.type === 'popup_failed_to_open') {
                        reject(new Error(
                            '팝업이 차단되었습니다.\n' +
                            '브라우저 주소창 우측의 팝업 차단 아이콘을 클릭해 허용해주세요.'
                        ));
                    } else {
                        reject(new Error(`인증 실패: ${err?.type || JSON.stringify(err)}\n\n` +
                            'Google Cloud Console에서 http://localhost:4000 을\n' +
                            '"Authorized JavaScript origins"에 추가했는지 확인하세요.'
                        ));
                    }
                },
            });
            client.requestAccessToken({ prompt: 'consent' });
        } catch (e: any) {
            reject(new Error(`GIS 초기화 실패: ${e.message}`));
        }
    });
}

export interface UploadMeta {
    title: string;
    description: string;
    tags: string[];
    scheduledAt?: Date | null;
    madeForKids?: boolean;
}

/**
 * YouTube Resumable Upload (5MB 청크)
 * @returns 업로드된 YouTube 영상 ID
 */
export async function uploadToYouTube(
    file: File,
    meta: UploadMeta,
    onProgress?: (percent: number) => void,
    token?: string
): Promise<string> {
    const tok = token || accessToken;
    if (!tok) throw new Error('YouTube 인증 토큰이 없습니다. 먼저 로그인하세요.');

    const status = meta.scheduledAt
        ? { privacyStatus: 'private', publishAt: meta.scheduledAt.toISOString() }
        : { privacyStatus: 'public' };

    const body = {
        snippet: {
            title: meta.title.slice(0, 100),
            description: meta.description.slice(0, 5000),
            tags: meta.tags.slice(0, 500),
            categoryId: '24',
            defaultLanguage: 'ja',
        },
        status: {
            ...status,
            selfDeclaredMadeForKids: meta.madeForKids ?? false,
        },
    };

    // 1. Resumable Upload 세션 초기화
    const initRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tok}`,
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': file.type || 'video/mp4',
                'X-Upload-Content-Length': String(file.size),
            },
            body: JSON.stringify(body),
        }
    );

    if (!initRes.ok) {
        const txt = await initRes.text();
        if (initRes.status === 401) {
            accessToken = null; // 토큰 만료 시 초기화
            throw new Error('인증 토큰이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error(`업로드 초기화 실패 (${initRes.status}): ${txt}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('업로드 URL을 받지 못했습니다.');

    // 2. 청크 업로드
    const CHUNK = 5 * 1024 * 1024; // 5 MB
    let sent = 0;

    while (sent < file.size) {
        const end = Math.min(sent + CHUNK, file.size);
        const chunk = file.slice(sent, end);

        const res = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Range': `bytes ${sent}-${end - 1}/${file.size}`,
                'Content-Type': file.type || 'video/mp4',
            },
            body: chunk,
        });

        if (res.status === 308) {
            const range = res.headers.get('Range');
            sent = range ? parseInt(range.split('-')[1]) + 1 : end;
            onProgress?.(Math.round((sent / file.size) * 95));
        } else if (res.status === 200 || res.status === 201) {
            const json = await res.json();
            onProgress?.(100);
            return json.id as string;
        } else {
            const txt = await res.text();
            throw new Error(`업로드 오류 (${res.status}): ${txt}`);
        }
    }

    throw new Error('업로드가 완료되지 않았습니다.');
}
