import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Key } from "lucide-react";
import { checkIfUserHasApiKey, storeUserApiKey } from "../actions";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AuthTokenModalProps {
    user: IUser;
    userHasApiKey: () => void;
    hasApiKey: boolean;
    setHasApiKey: (hasApiKey: boolean) => void;
}

const AuthTokenModal: React.FC<AuthTokenModalProps> = ({ user, userHasApiKey, hasApiKey, setHasApiKey }) => {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState<string>("");


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="flex flex-row items-center gap-2"
                    onClick={async () => {
                        userHasApiKey();
                    }}
                >
                    <Key size={16} />
                    <span>Set your key</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set your OpenAI API Key</DialogTitle>
                    <DialogDescription>
                        This key is kept encrypted and never stored on our servers as plain text.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row gap-2 py-4">
                    <Input
                        id="api_key"
                        value={apiKey}
                        disabled={hasApiKey}
                        placeholder={hasApiKey ? "sk-... (OpenAI API Key set)" : "sk-..."}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                        }}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        disabled={!apiKey || hasApiKey}
                        onClick={async () => {
                            if (!hasApiKey) {
                                await storeUserApiKey(user.user_id, apiKey);
                                setHasApiKey(true);  // Set this immediately
                                userHasApiKey();
                                toast({
                                    description: "OpenAI API Key added",
                                });
                                setApiKey("********************");
                            }
                        }}
                    >
                        <Check className="flex-shrink-0" size={18} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthTokenModal;
