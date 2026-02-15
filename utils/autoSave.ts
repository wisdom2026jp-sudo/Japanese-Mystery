// Auto-save and restore functionality for HealingPlan

import { HealingPlan } from '../types';

const STORAGE_KEY = 'autogen_pro_backup';
const AUTOSAVE_INTERVAL = 5000; // 5초마다 자동 저장

export const saveToLocalStorage = (plan: HealingPlan | null, userBgm: File | null) => {
    try {
        if (!plan) return;

        const backup = {
            plan,
            userBgmName: userBgm?.name || null,
            timestamp: Date.now(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
        console.log('✅ 자동 저장 완료:', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('❌ 자동 저장 실패:', error);
    }
};

export const loadFromLocalStorage = (): { plan: HealingPlan; userBgmName: string | null; timestamp: number } | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;

        const backup = JSON.parse(saved);
        console.log('✅ 백업 발견:', new Date(backup.timestamp).toLocaleString());

        return backup;
    } catch (error) {
        console.error('❌ 백업 로드 실패:', error);
        return null;
    }
};

export const clearBackup = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ 백업 삭제됨');
    } catch (error) {
        console.error('❌ 백업 삭제 실패:', error);
    }
};

export const hasBackup = (): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== null;
};
