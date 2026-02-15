import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyDzkgeY6t2qJrYCrt4ycAyxXgC6QJpzvuk';

async function testVeoAccess() {
    try {
        console.log('Testing Veo 3.1 access...');

        const genAI = new GoogleGenerativeAI(API_KEY);

        // Try to access Veo model
        const model = genAI.getGenerativeModel({ model: 'veo-001' });

        console.log('✅ Veo model found! You have access.');
        return true;

    } catch (error: any) {
        console.error('❌ Veo access test failed:');
        console.error(error.message);

        if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.log('\n💡 This API key does NOT have Veo access.');
            console.log('   You need to:');
            console.log('   1. Request Veo beta access at aistudio.google.com');
            console.log('   2. Get an API key with Veo permissions');
        }

        return false;
    }
}

testVeoAccess();
