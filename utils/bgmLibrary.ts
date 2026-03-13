/**
 * bgmLibrary.ts
 * public/BGM 폴더의 파일 목록을 관리하고 랜덤 선택 기능을 제공합니다.
 * BGM 폴더에 새 파일을 추가하면 이 목록에도 추가해주세요.
 */

export interface BgmTrack {
  id: string;
  filename: string;
  /** /BGM/filename 형태의 URL (Vite public 폴더 기준) */
  url: string;
  label: string;
}

const BGM_FILES: string[] = [
  '미래경고5.mp3',
  '미래경고5 (1).mp3',
  '미래경고5 (2).mp3',
  '미래경고5 (3).mp3',
  '미래경고5 (4).mp3',
  '미래경고5 (5).mp3',
  '미래경고5 (6).mp3',
  '미래경고5 (7).mp3',
  '미래경고5 (8).mp3',
  '미래경고5 (9).mp3',
  '미래경고6.mp3',
  '미래경고6 (1).mp3',
  '미래경고6 (2).mp3',
  '미래경고6 (3).mp3',
  '미래경고6 (4).mp3',
  '미래경고6 (5).mp3',
  '미래경고6 (6).mp3',
  '미래경고6 (7).mp3',
  '미래경고6 (8).mp3',
  '미래경고6 (9).mp3',
];

export const BGM_LIBRARY: BgmTrack[] = BGM_FILES.map((filename, i) => ({
  id: `bgm_${i}`,
  filename,
  url: `/BGM/${encodeURIComponent(filename)}`,
  label: filename.replace('.mp3', ''),
}));

/**
 * BGM 라이브러리에서 랜덤으로 1곡 선택
 * @param excludeId 제외할 BGM ID (같은 곡 연속 방지)
 */
export function pickRandomBgm(excludeId?: string): BgmTrack {
  const pool = excludeId
    ? BGM_LIBRARY.filter(b => b.id !== excludeId)
    : BGM_LIBRARY;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * BGM URL을 fetch하여 File 객체로 변환
 * (PythonExport의 userBgm prop과 호환)
 */
export async function fetchBgmAsFile(track: BgmTrack): Promise<File> {
  const response = await fetch(track.url);
  if (!response.ok) throw new Error(`BGM fetch failed: ${track.url}`);
  const blob = await response.blob();
  return new File([blob], track.filename, { type: 'audio/mpeg' });
}
