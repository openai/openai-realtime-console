import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserById } from "@/db/users";

interface IPayload {
  user: IUser;
  supabase: SupabaseClient;
  timestamp: string;
}

const getChatHistory = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<string> => {
  try {
      const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

      if (error) throw error;

      const messages = data.map((chat: IConversation) => `${chat.role}: ${chat.content}`)
          .join('\n');

      return messages;
  } catch (error: any) {
      throw new Error(`Failed to get chat history: ${error.message}`);
  }
};

const UserPromptTemplate = (user: IUser) => `
YOU ARE TALKING TO someone whose name is: ${user.supervisee_name} and age is: ${user.supervisee_age} with a personality described as: ${user.supervisee_persona}.

Act with the best of intentions using Cognitive Behavioral Therapy techniques to help people feel safe and secure.
Do not ask for personal information.
Your physical form is in the form of a physical object or a toy.
A person interacts with you by pressing a button, sends you instructions and you must respond in a concise conversational style.
`;

const DoctorPromptTemplate = (user: IUser) => {
  const userMetadata = user.user_info.user_metadata as IDoctorMetadata;
  const doctorName = userMetadata.doctor_name || 'Doctor';
  const hospitalName = userMetadata.hospital_name || 'An amazing hospital';
  const specialization = userMetadata.specialization || 'general medicine';
  const favoritePhrases = userMetadata.favorite_phrases || "You're doing an amazing job";

  return `
YOU ARE TALKING TO a patient under the care of doctor ${doctorName} from hospital or clinic ${hospitalName}. The child may be undergoing procedures such as ${specialization}.

YOU ARE: A friendly, compassionate toy designed to offer comfort and care. You specialize in calming children and answering their questions with simple, concise and soothing explanations.

YOUR FAVORITE PHRASES ARE: ${favoritePhrases}
  `;
};

const getCommonPromptTemplate = (chatHistory: string, user: IUser, timestamp: string) => `
YOUR VOICE IS: ${user.personality?.voice_prompt}

YOUR CHARACTER PROMPT IS: ${user.personality?.character_prompt}
CHAT HISTORY:
${chatHistory}

USER'S CURRENT TIME IS: ${timestamp}

LANGUAGE:
You may talk in any language the user would like, but the default language is ${user?.language?.name ?? 'English'}.
`;

const createSystemPrompt = async (
  payload: IPayload,
): Promise<string> => {
  const { user, supabase, timestamp } = payload;
  const chatHistory = await getChatHistory(supabase, user.user_id);
  const commonPrompt = getCommonPromptTemplate(chatHistory, user, timestamp);

  let systemPrompt;
  switch (user.user_info.user_type) {
      case 'user':
          systemPrompt = UserPromptTemplate(user);
          break;
      case 'doctor':
          systemPrompt = DoctorPromptTemplate(user);
          break;
      default:
          throw new Error('Invalid user type');
  }
  return systemPrompt + commonPrompt;
};

/**
 * Decrypts an encrypted secret with the same master encryption key.
 * @param encryptedData - base64 string from the database
 * @param iv - base64 IV from the database
 * @param masterKey - 32-byte string or buffer
 * @returns the original plaintext secret
 */
function decryptSecret(encryptedData: string, iv: string, masterKey: string) {
  // Decode the base64 master key
  const decodedKey = Buffer.from(masterKey, 'base64');
  if (decodedKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes when decoded from base64.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc' as any,
    Buffer.from(masterKey, 'base64') as any,
    Buffer.from(iv, 'base64') as any
  );

  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const getOpenAiApiKey = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<string> => {
  const { data, error } = await supabase
      .from('api_keys')
      .select('encrypted_key, iv')
      .eq('user_id', userId)
      .single();

  if (error) throw error;

  const { encrypted_key, iv } = data;
  const masterKey = process.env.ENCRYPTION_KEY!;

  const decryptedKey = decryptSecret(encrypted_key, iv, masterKey);

  return decryptedKey;
};


export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getUserById(supabase, user.id);
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const openAiApiKey = await getOpenAiApiKey(supabase, user.id);
  const systemPrompt = await createSystemPrompt({ user: dbUser, supabase, timestamp: new Date().toISOString() });

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-realtime-preview-2024-12-17',
          instructions: systemPrompt,
          voice: dbUser.personality?.oai_voice ?? 'ash'
        }),
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
