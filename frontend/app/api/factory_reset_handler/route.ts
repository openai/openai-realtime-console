import { NextResponse } from 'next/server';
import jwt from "jsonwebtoken";
import { createClient } from '@/utils/supabase/server';


export async function POST(req: Request) {
    try {
        const { authToken } = await req.json();
        const supabase = createClient({
            global: {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            },
        });

        const { data: user, error: userError } = await supabase.auth.getUser();

        if (userError) {
            return NextResponse.json(
                { error: userError.message },
                { status: 401 }
            );
        }

        // set is_reset to false
        const { data, error } = await supabase.from('devices').update({
            is_reset: false,
        }).eq('user_id', user.user.id).select();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}