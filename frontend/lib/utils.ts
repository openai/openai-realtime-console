import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    defaultPersonalityId,
    defaultToyId,
    INITIAL_CREDITS,
    SECONDS_PER_CREDIT,
} from "./data";
import crypto from "crypto";
export const getOpenGraphMetadata = (title: string) => {
    return {
        openGraph: {
            title: `${title} | Elato AI`,
        },
    };
};

// code in the form: aabbccddeeff
export const isValidMacAddress = (macAddress: string): boolean => {
    // Check if macAddress is a valid MAC address without separators
    const macRegex = /^[0-9A-Fa-f]{12}$/;
    return macRegex.test(macAddress);
};

export const getMacAddressFromDeviceCode = (deviceCode: string): string => {
    // add colons to the device code
    return deviceCode.substring(0, 2) + ":" + deviceCode.substring(2, 4) + ":" + deviceCode.substring(4, 6) + ":" + deviceCode.substring(6, 8) + ":" + deviceCode.substring(8, 10) + ":" + deviceCode.substring(10, 12);
};

export const getPersonalityImageSrc = (title: string) => {
    return `/personality/${title.toLowerCase().replace(/\s+/g, "_")}.jpeg`;
};

export function removeEmojis(text: string): string {
    const emojiPattern: RegExp =
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}]/gu;
    return text.replace(emojiPattern, "");
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const isDefaultPersonality = (personality: IPersonality) => {
    return personality.personality_id === defaultPersonalityId;
};

export const isDefaultVoice = (toy: IToy) => {
    return toy.toy_id === defaultToyId;
};

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? "https://elatoai.com"
        : "http://localhost:3000";
};

export const getUserAvatar = (avatar_url: string) => {
    // return `/kidAvatar_boy_1.png`;

    return avatar_url;
    // get random number between 0 and 9
    //   const randomNum = Math.floor(Math.random() * 10);
    //   return `/user_avatar/user_avatar_${randomNum}.png`;
};

export const getAssistantAvatar = (imageSrc: string) => {
    return "/" + imageSrc + ".png";
};

export const getCreditsRemaining = (user: IUser): number => {
    const usedCredits = user.session_time / SECONDS_PER_CREDIT;
    const remainingCredits = Math.round(INITIAL_CREDITS - usedCredits);
    return Math.max(0, remainingCredits); // Ensure credits don't go below 0
};

export const getMessageRoleName = (
    role: string,
    selectedPersonalityTranslation: IPersonalitiesTranslation
) => {
    if (role === "input") {
        return "You";
    } else {
        return selectedPersonalityTranslation.title;
    }
};

export function encryptSecret(secret: string, masterKey: string) {
    // Decode the base64 master key
    const decodedKey = Buffer.from(masterKey, 'base64');
    if (decodedKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes when decoded from base64.');
    }
  
    // Generate a 16-byte IV
    const ivBuf = crypto.randomBytes(16);
  
    // Use type assertion to string for algorithm and force the types for key and iv
    const cipher = crypto.createCipheriv(
        'aes-256-cbc' as string,
        decodedKey as unknown as crypto.CipherKey,
        ivBuf as unknown as crypto.BinaryLike
    );
  
    let encrypted = cipher.update(secret, 'utf8', 'base64');
    encrypted += cipher.final('base64');
  
    return {
      iv: ivBuf.toString('base64'),
      encryptedData: encrypted,
    };
}