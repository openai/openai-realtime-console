// types/type.d.ts

declare global {
    interface IInbound {
        inbound_id?: string;
        name: string;
        email: string;
        type: "demo" | "preorder";
    }

    interface ILanguage {
        language_id: string;
        code: string;
        name: string;
        flag: string;
    }

    type ProductColor = "black" | "white" | "gray";

    interface IUser {
        user_id: string;
        avatar_url: string;
        is_premium: boolean;
        supervisor_name: string;
        email: string;
        supervisee_name: string;
        supervisee_persona: string;
        supervisee_age: number;
        // language_id: string;
        volume_control: number;
        is_reset: boolean;
        is_ota: boolean;
        personality_id: string;
        personality?: IPersonality;
        // language?: ILanguage;
        modules: Module[];
        most_recent_chat_group_id: string | null;
        session_time: number;
        user_info: UserInfo;
        language_code: LanguageCodeType;
    }

    type UserInfo =
        | {
              user_type: "user";
              user_metadata: IUserMetadata;
          }
        | {
              user_type: "doctor";
              user_metadata: IDoctorMetadata;
          }
        | {
              user_type: "business";
              user_metadata: IBusinessMetadata;
          };

    interface IBusinessMetadata {}

    interface IDoctorMetadata {
        doctor_name: string;
        specialization: string;
        hospital_name: string;
        favorite_phrases: string;
    }

    interface IUserMetadata {}

    interface IConversation {
        conversation_id?: string;
        toy_id: string;
        user_id: string;
        role: string;
        content: string;
        metadata: any;
        chat_group_id: string;
        is_sensitive: boolean;
        emotion_model: string;
    }

    type LanguageCodeType = "en-US" | "de-DE" | "es-ES" | "es-AR" | "zh-CN";
    type TTSModel = "FISH" | "AZURE";

    // characters <-> personalities table
    interface IPersonality {
        personality_id: string;
        is_doctor: boolean;
        is_child_voice: boolean;
        key: string;
        personalities_translations: IPersonalitiesTranslation[];
    }

    type PersonalityFilter = "is_child_voice" | "is_doctor";

    interface IPersonalitiesTranslation {
        personalities_translation_id: string;
        title: string;
        subtitle: string;
        trait_short_description: string;
        personality_key: string;
        personality?: IPersonality;
        voice_name: string;
        voice?: Partial<IToy>;
        language_code: LanguageCodeType;
        language?: ILanguage;
    }

    // voices <-> toys table
    interface IToy {
        toy_id: string;
        name: string;
        image_src?: string;
        tts_code: string;
        tts_model: TTSModel;
        tts_language_code: LanguageCodeType;
        tts_language?: ILanguage;
    }

    interface InsightsConversation {
        conversation_id?: string;
        created_at: string;
        toy_id: string;
        user_id: string;
        role: string;
        content: string;
        metadata: any;
        chat_group_id: string;
    }

    type Module = "math" | "science" | "spelling" | "general_trivia";

    type PieChartData = {
        id: string;
        label: string;
        value: number | null;
    };

    interface DataPoint {
        x: string;
        y: number;
    }

    interface HeatMapData {
        id: string;
        data: DataPoint[];
    }

    interface LineChartData {
        id: any;
        name: string;
        data: any;
    }

    interface ProcessedData {
        cardData: CardData | null;
        barData: BarData[];
        lineData: LineData[];
        pieData: PieData[];
        suggestions: string | undefined;
    }

    interface CardData {
        [key: string]: {
            title: string;
            value: number;
            change: number | null;
        };
    }

    interface BarData {
        emotion: string;
        [key: string]: number | string;
    }

    interface LineData {
        id: string;
        name: string;
        data: { x: string; y: number | null }[];
    }

    interface PieData {
        id: string;
        label: string;
        value: number | null;
    }

    interface PlaygroundProps {
        selectedUser: IUser;
        selectedToy: IToy;
        accessToken: string;
    }

    interface LastJsonMessageType {
        type: string;
        audio_data: string | null;
        text_data: string | null;
        boundary: string | null;
        task_id: string;
    }

    export interface MessageHistoryType {
        type: string;
        text_data: string | null;
        task_id: string;
    }
}

export {}; // This is necessary to make this file a module and avoid TypeScript errors.
