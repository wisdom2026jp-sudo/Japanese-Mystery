// YouTube 메타데이터 생성기

import { HealingPlan, PersonaType } from '../types';

export interface YouTubeMetadata {
    title: string;
    description: string;
    hashtags: string[];
    tags: string[];
    thumbnailTips: string[];
    viralHooks: string[];
    targetAudience: string;
    category: string;
    bestPostingTime: string;
}

export function generateYouTubeMetadata(plan: HealingPlan, persona: PersonaType): YouTubeMetadata {
    const title = optimizeTitle(plan.title_ja, persona);
    const description = generateDescription(plan, persona);
    const hashtags = generateHashtags(plan, persona);
    const tags = generateTags(plan, persona);

    return {
        title,
        description,
        hashtags,
        tags,
        thumbnailTips: getThumbnailTips(persona),
        viralHooks: extractViralHooks(plan.script_ja),
        targetAudience: getTargetAudience(persona),
        category: '22', // People & Blogs
        bestPostingTime: getBestPostingTime(persona),
    };
}

function optimizeTitle(originalTitle: string, persona: PersonaType): string {
    // YouTube 알고리즘 최적화 제목 (60자 이하)
    const hooks: Record<PersonaType, string[]> = {
        mystery: ['衝撃', '真実', '怖い話', '都市伝説', '実話'],
        success: ['成功', '人生変わる', '〇〇分で', '知らないと損', '億万長者'],
        dopamine: ['爆笑', 'ウケる', '面白', 'ヤバい', '最高'],
        healer: ['癒し', '心が落ち着く', 'リラックス', '泣ける', '感動'],
    };

    const hook = hooks[persona][Math.floor(Math.random() * hooks[persona].length)];

    // 기존 제목이 60자 이하면 그대로, 아니면 앞에 후킹 추가
    if (originalTitle.length > 60) {
        return `【${hook}】${originalTitle.substring(0, 50)}...`;
    }

    return `【${hook}】${originalTitle}`;
}

function generateDescription(plan: HealingPlan, persona: PersonaType): string {
    const intro = getIntroduction(persona);
    const mainContent = plan.description_ja || plan.script_ja.substring(0, 200) + '...';
    const cta = getCallToAction(persona);
    const hashtags = generateHashtags(plan, persona).map(h => `#${h}`).join(' ');

    return `${intro}

${mainContent}

━━━━━━━━━━━━━━━━
🔔 チャンネル登録お願いします！
👍 高評価してくれると嬉しいです
💬 コメントで感想聞かせてください

${cta}

━━━━━━━━━━━━━━━━
${hashtags}

#Shorts #日本 #ショート動画`;
}

function generateHashtags(plan: HealingPlan, persona: PersonaType): string[] {
    const baseHashtags: Record<PersonaType, string[]> = {
        mystery: ['都市伝説', 'ミステリー', '怖い話', '不思議な話', '謎'],
        success: ['成功', 'ビジネス', '自己啓発', 'マインド', '起業家'],
        dopamine: ['面白い', '爆笑', 'あるある', '共感', 'ネタ'],
        healer: ['癒し', 'リラックス', '心理学', '感動', '泣ける'],
    };

    const common = ['Shorts', 'ショート動画', '日本'];
    const specific = baseHashtags[persona];

    // plan.tags에서 추가
    const aiTags = plan.tags?.slice(0, 5) || [];

    return [...specific, ...common, ...aiTags].slice(0, 15);
}

function generateTags(plan: HealingPlan, persona: PersonaType): string[] {
    const baseTags: Record<PersonaType, string[]> = {
        mystery: [
            '都市伝説', 'ミステリー', '怖い話', '不思議', '謎解き',
            '実話', '日本の怪談', 'ホラー', '心霊', '未解決事件'
        ],
        success: [
            '成功法則', 'ビジネス', '自己啓発', '起業', 'マインドセット',
            '成功者', '億万長者', '仕事術', 'キャリア', '人生'
        ],
        dopamine: [
            '面白い', '爆笑', 'コメディ', 'あるある', 'ネタ',
            '笑える', 'ウケる', 'バズる', '共感', '日常'
        ],
        healer: [
            '癒し', 'リラックス', '心理学', '感動', 'ストレス解消',
            'メンタルヘルス', '自己肯定感', '心が楽になる', 'マインドフルネス', '瞑想'
        ],
    };

    const aiTags = plan.tags || [];

    return [...baseTags[persona], ...aiTags, 'Shorts', '日本語', 'ショート動画'].slice(0, 30);
}

function getThumbnailTips(persona: PersonaType): string[] {
    const tips: Record<PersonaType, string[]> = {
        mystery: [
            '💀 暗い背景 + 赤色アクセント',
            '👁️ 視線を引く衝撃的な画像',
            '❓ 大きな疑問符を入れて好奇心を刺激',
            '📸 ナイトビジョン風エフェクト',
            '🔴 "実話"や"閲覧注意"のバッジ'
        ],
        success: [
            '💰 ゴールド/高級感のある色',
            '📊 上昇グラフやチャート',
            '👔 成功者のイメージ',
            '✨ "〇〇分で人生変わる"のテキスト',
            '💎 キラキラエフェクト'
        ],
        dopamine: [
            '😂 笑顔や面白い表情',
            '🎨 カラフルで明るい色使い',
            '💥 "爆笑"や"ヤバい"の大きなテキスト',
            '🤣 リアクション画像',
            '⚡ ポップなフォント'
        ],
        healer: [
            '🌸 柔らかいパステルカラー',
            '🌅 美しい風景や自然',
            '💙 青や緑の癒し系カラー',
            '☁️ 雲や水のイメージ',
            '✨ "心が落ち着く"のテキスト'
        ],
    };

    return tips[persona];
}

function extractViralHooks(script: string): string[] {
    // 스크립트에서 임팩트 있는 문장 추출 (간단한 휴리스틱)
    const sentences = script.split(/[。！？]/);
    const impactful = sentences.filter(s =>
        s.includes('実は') ||
        s.includes('驚き') ||
        s.includes('信じられない') ||
        s.includes('衝撃') ||
        s.length > 20 && s.length < 50
    );

    return impactful.slice(0, 5);
}

function getTargetAudience(persona: PersonaType): string {
    const audiences: Record<PersonaType, string> = {
        mystery: '18-45歳、ミステリー・オカルト好き、夜型の視聴者',
        success: '25-55歳、ビジネスパーソン、起業家志望、自己啓発に興味',
        dopamine: '13-35歳、エンタメ好き、SNSヘビーユーザー',
        healer: '20-50歳、癒しを求める、ストレス多い、女性多め',
    };

    return audiences[persona];
}

function getBestPostingTime(persona: PersonaType): string {
    const times: Record<PersonaType, string> = {
        mystery: '21:00-23:00 (夜、寝る前のリラックスタイム)',
        success: '07:00-09:00 / 20:00-22:00 (通勤時間・帰宅後)',
        dopamine: '12:00-13:00 / 18:00-20:00 (ランチ・帰宅時)',
        healer: '22:00-24:00 (就寝前のリラックス)',
    };

    return times[persona];
}

function getIntroduction(persona: PersonaType): string {
    const intros: Record<PersonaType, string> = {
        mystery: '【閲覧注意】信じられない都市伝説をお届けします...',
        success: '【人生変わる】成功者だけが知っている秘密を公開！',
        dopamine: '【爆笑必至】思わず笑ってしまう面白エピソード！',
        healer: '【心が楽になる】忙しいあなたに癒しのひとときを...',
    };

    return intros[persona];
}

function getCallToAction(persona: PersonaType): string {
    const ctas: Record<PersonaType, string> = {
        mystery: '🔔 もっと怖い話が見たい方はチャンネル登録！\n次回も衝撃的な都市伝説をお届けします！',
        success: '🚀 成功への第一歩を踏み出したい方はチャンネル登録！\n毎日ビジネスのヒントをお届けします！',
        dopamine: '😂 もっと笑いたい方はチャンネル登録！\n毎日面白動画を更新中！',
        healer: '💙 癒されたい方はチャンネル登録！\n心が楽になる動画を毎日配信！',
    };

    return ctas[persona];
}

export function formatMetadataForFile(metadata: YouTubeMetadata): string {
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 YouTube Shorts メタデータ
━━━━━━━━━━━━━━━━━━━━━━━━━━

【タイトル】(${metadata.title.length}文字)
${metadata.title}

【説明】
${metadata.description}

【ハッシュタグ】(動画説明に含める)
${metadata.hashtags.map(h => `#${h}`).join(' ')}

【タグ】(YouTube Studio で設定)
${metadata.tags.join(', ')}

【カテゴリ】
${metadata.category} (People & Blogs)

【ターゲット視聴者】
${metadata.targetAudience}

【最適投稿時間】
${metadata.bestPostingTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 サムネイル制作のヒント
━━━━━━━━━━━━━━━━━━━━━━━━━━

${metadata.thumbnailTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 バイラルフック (強調すべきポイント)
━━━━━━━━━━━━━━━━━━━━━━━━━━

${metadata.viralHooks.map((hook, i) => `${i + 1}. "${hook}"`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 YouTube アルゴリズム最適化のコツ
━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ アップロード後最初の1時間が重要
✅ 視聴維持率を上げるため最初3秒で惹きつける
✅ コメントに積極的に返信して engagement を高める
✅ コミュニティタブで予告投稿
✅ 再生リスト に追加して関連動画表示を増やす

━━━━━━━━━━━━━━━━━━━━━━━━━━
作成日時: ${new Date().toLocaleString('ja-JP')}
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
