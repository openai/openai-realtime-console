import { checkIfUserHasApiKey, registerDevice, setDeviceOta, setDeviceReset, signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, Cog, LogOut, RefreshCw } from "lucide-react";
import AuthTokenModal from "../AuthTokenModal";
import DoctorForm from "./DoctorForm";
import GeneralUserForm from "./UserForm";
import { Slider } from "@/components/ui/slider";
import { updateUser } from "@/db/users";
import _ from "lodash";
import { createClient } from "@/utils/supabase/client";
import React, { useCallback } from "react";
import { doesUserHaveADevice } from "@/db/devices";
import { useToast } from "@/components/ui/use-toast";

interface AppSettingsProps {
    selectedUser: IUser;
    heading: React.ReactNode;
}

const AppSettings: React.FC<AppSettingsProps> = ({
    selectedUser,
    heading,
}) => {
    const supabase = createClient();
    const { toast } = useToast();
    const [isConnected, setIsConnected] = React.useState(false);
    const doctorFormRef = React.useRef<{ submitForm: () => void } | null>(null);
    const userFormRef = React.useRef<{ submitForm: () => void } | null>(null);
    const [deviceCode, setDeviceCode] = React.useState("");
    const [error, setError] = React.useState("");
    const [hasApiKey, setHasApiKey] = React.useState<boolean>(false);

    const userHasApiKey = useCallback(async () => {
        const hasApiKey = await checkIfUserHasApiKey(selectedUser.user_id);
        setHasApiKey(hasApiKey);
    }, [selectedUser.user_id]);
    
    // ... existing code ...

    const handleSave = () => {
        if (selectedUser.user_info.user_type === "doctor") {
            doctorFormRef.current?.submitForm();
        } else {
            userFormRef.current?.submitForm();
        }
    };

    const checkIfUserHasDevice = useCallback(async () => {
        setIsConnected(
            await doesUserHaveADevice(supabase, selectedUser.user_id)
        );
    }, [selectedUser.user_id, supabase]);

    React.useEffect(() => {
        checkIfUserHasDevice();
        userHasApiKey();
    }, [checkIfUserHasDevice, userHasApiKey]);

    const [volume, setVolume] = React.useState([
        selectedUser.volume_control ?? 50,
    ]);
    const [isReset, setIsReset] = React.useState(selectedUser.is_reset);
    const [isOta, setIsOta] = React.useState(selectedUser.is_ota);

    const debouncedUpdateVolume = _.debounce(async () => {
        await updateUser(
            supabase,
            { volume_control: volume[0] },
            selectedUser.user_id
        );
    }, 1000); // Adjust the debounce delay as needed

    const updateVolume = (value: number[]) => {
        setVolume(value);
        debouncedUpdateVolume();
    };

    const onSave = async (values: any, userType: "doctor" | "user") => {
        console.log("onSave", values, userType);
       if (userType === "doctor") {
        await updateUser(
            supabase,
            {
                user_info: {
                    user_type: userType,
                    user_metadata: values,
                },
            },
            selectedUser!.user_id);
    } else {
        await updateUser(
            supabase,
            {
                supervisee_age: values.supervisee_age,
                supervisee_name: values.supervisee_name,
                supervisee_persona: values.supervisee_persona,
                user_info: {
                    user_type: userType,
                    user_metadata: values,
                },  
            },
            selectedUser!.user_id);
    }
    toast({
        description: "Your prefereces have been saved!",
    });
}

    return (
        <>
            {selectedUser.user_info.user_type === "doctor" ? (
                <DoctorForm
                    selectedUser={selectedUser}
                    heading={heading}
                    onSave={onSave}
                    onClickCallback={() => handleSave()}
                />
            ) : (
                <GeneralUserForm
                    selectedUser={selectedUser}
                    heading={heading}
                    onSave={onSave}
                    onClickCallback={() => handleSave()}
                />
            )}
            <section className="space-y-4 max-w-screen-sm mt-12">
                <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">
                    Device settings
                </h2>
                <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">
                            Register your device
                        </Label>
                        <div 
                            className={`rounded-full flex-shrink-0 h-2 w-2 ${
                                isConnected ? 'bg-green-500' : 'bg-amber-500'
                            }`} 
                        />                    </div>
                        
                        <div className="flex flex-row items-center gap-2 mt-2">
                            <Input
                                value={deviceCode}
                                disabled={isConnected}
                                onChange={(e) => setDeviceCode(e.target.value)}
                                placeholder={isConnected ? "**********" : "Enter your device code"}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={isConnected}
                                onClick={async () => {
                                    const result = await registerDevice(selectedUser.user_id, deviceCode);
                                    if (result.error) {
                                        setError(result.error);
                                    }
                                    checkIfUserHasDevice();
                                }}
                            >
                                Register
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400">
                            {isConnected ? <span className="font-medium text-gray-800">Registered!</span> :
                                error ? <span className="text-red-500">{error}.</span> :
                                "Add your device code to your account to register it."
                        }
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center gap-2">
                    <Label className="text-sm font-medium text-gray-700">
                            Set your OpenAI API Key
                        </Label>
                        <div 
                            className={`rounded-full flex-shrink-0 h-2 w-2 ${
                                hasApiKey ? 'bg-green-500' : 'bg-amber-500'
                            }`} 
                        />                    </div>
                        <div className="flex flex-row items-center gap-2 mt-2">
                            <AuthTokenModal user={selectedUser} userHasApiKey={userHasApiKey} hasApiKey={hasApiKey} setHasApiKey={setHasApiKey} />
                        </div>
                        <p className="text-xs text-gray-400">
                            Your keys are E2E encrypted and never stored on our servers as plain text.
                        </p>
                    </div>
                    {/* <div className="flex flex-col gap-4 flex-nowrap">
                        <Label className="text-sm font-medium text-gray-700">
                            Over-the-air (OTA) updates
                        </Label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-normal flex flex-row items-center gap-2 w-fit"
                                    onClick={async () => {
                                        setIsOta(true);
                                        await setDeviceOta(
                                            selectedUser.user_id
                                        );
                                    }}
                                    disabled={isOta}
                                >
                                    <RefreshCw size={16} />
                                    <span>Update</span>
                                </Button>
                                {isOta ? (
                                    <p className="text-xs text-gray-400 inline">
                                        <Check
                                            size={16}
                                            className="inline-block mr-1"
                                        />
                                        Your device will be updated on next
                                        start
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400">
                                        This will update your device software to
                                        the latest version.
                                    </p>
                                )}
                            </div>
                            <Label className="text-sm font-medium text-gray-700">
                            Factory reset
                        </Label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="font-normal flex flex-row items-center gap-2 w-fit"
                                    onClick={async () => {
                                        setIsReset(true);
                                        await setDeviceReset(
                                            selectedUser.user_id
                                        );
                                    }}
                                    disabled={isReset}
                                >
                                    <Cog size={16} />
                                    <span>Factory reset</span>
                                </Button>
                                {isReset ? (
                                    <p className="text-xs text-gray-400 inline">
                                        <Check
                                            size={16}
                                            className="inline-block mr-1"
                                        />
                                        Your device will be factory reset on next start
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400">
                                        Caution: This will reset your wifi and authentication details on your device.
                                    </p>
                                )}
                            </div>
                        </div> */}

                    <div className="flex flex-col gap-2 mt-4">
                        <Label className="text-sm font-medium text-gray-700">
                            Logged in as
                        </Label>
                        <Input
                            // autoFocus
                            disabled
                            value={selectedUser?.email}
                            className="max-w-screen-sm h-10 bg-white"
                            autoComplete="on"
                            style={{
                                fontSize: 16,
                            }}
                        />
                    </div>
                    <div className="flex flex-col gap-4 mt-6">
                        <Label className="text-sm font-medium text-gray-700">
                            Device volume
                        </Label>
                        <div className="flex flex-row gap-2 items-center flex-nowrap">
                            <Slider
                                value={volume}
                                onValueChange={updateVolume}
                                className="sm:w-1/2"
                                defaultValue={[50]}
                                max={100}
                                min={1}
                                step={1}
                            />
                            <p className="text-gray-500 text-sm">{volume}%</p>
                        </div>
                    </div>                                   
            <form
                            action={signOutAction}
                        className="flex flex-row justify-between mt-4"
                    >
                        <Button
                            variant="destructive_outline"
                            size="sm"
                            className="font-medium flex flex-row items-center rounded-full gap-2 "
                        >
                            <LogOut size={18} strokeWidth={2} />
                            <span>Logout</span>
                            </Button>
                        </form>
                </div>
            </section>
        </>
    );
};

export default AppSettings;
