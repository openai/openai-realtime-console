import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const ALGORITHM = "HS256";

async function createAccessToken(data: any, expireDays?: number) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const now = new Date();
    
    let payload = { ...data };
    if (expireDays) {
        const expire = new Date();
        expire.setDate(now.getDate() + expireDays);
        payload.exp = expire.toISOString();
    }

    if (payload.created_time) {
        payload.created_time = payload.created_time.toISOString();
    }

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: ALGORITHM })
        .sign(secret);
    
    return token;
}

export async function POST(req: Request) {
    try {
        const { email, userId, expireDays } = await req.json();

        const payload = {
            email,
            user_id: userId,
            created_time: new Date()
        };

        const token = await createAccessToken(payload, expireDays);

        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}