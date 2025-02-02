import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Key } from "lucide-react";
import { generateStarmoonAuthKey } from "../actions";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface AuthTokenModalProps {
    user: IUser;
}

const AuthTokenModal: React.FC<AuthTokenModalProps> = ({ user }) => {
    const { toast } = useToast();

    const [apiKey, setApiKey] = useState<string | null>(null);
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="font-normal flex flex-row items-center gap-2"
                    onClick={async () => {
                        setApiKey(await generateStarmoonAuthKey(user));
                    }}
                >
                    <Key size={16} />
                    <span>Generate Key</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Your Humloop API Key</DialogTitle>
                    <DialogDescription>
                        This key will be hidden once you close this dialog. Keep
                        it safe!
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-row gap-2 py-4">
                    <Input
                        id="api_key"
                        value={apiKey ?? ""}
                        disabled
                        placeholder="Loading your API Key"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            navigator.clipboard.writeText(apiKey ?? "");
                            toast({
                                description:
                                    "Humloop API Key copied to clipboard",
                            });
                        }}
                    >
                        <Copy size={18} />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthTokenModal;
