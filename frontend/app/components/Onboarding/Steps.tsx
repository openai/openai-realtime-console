"use client";

import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import UserType from "./UserType";
import GeneralUserForm from "../Settings/UserForm";
import DoctorForm from "../Settings/DoctorForm";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { checkDoctorAction } from "@/app/actions";
import { useToast } from "@/components/ui/use-toast";

type TUserType = "doctor" | "user" | "business";

const Steps: React.FC<{
    selectedUser: IUser;
}> = ({ selectedUser }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [progress, setProgress] = React.useState(40);
    const [step, setStep] = React.useState(0);
    const [selectedType, setSelectedType] = useState<TUserType | null>(null);
    const [doctorAuthCode, setDoctorAuthCode] = useState<string>("");

    const onSelectType = (type: TUserType) => {
        setSelectedType(type);
        setStep(1);
        setProgress(progress + 30);
    };

    const onClickBack = () => {
        setStep(step - 1);
        setProgress(progress - 30);
    };

    const onClickFormCallback = async () => {
        if (selectedType === "doctor") {
            const res = await checkDoctorAction(doctorAuthCode);
            if (!res) {
                toast({
                    description:
                        "Your sign-up code did not match our records. Try again or reach out to us for help.",
                });
                return;
            }
        }
        setStep(step + 1);
        setProgress(progress + 30);
        router.push("/home");
    };

    const CurrentForm = () => {
        if (step === 0) {
            return (
                <UserType
                    selectedUser={selectedUser}
                    onSelectType={onSelectType}
                    selectedType={selectedType}
                />
            );
        } else {
            if (selectedType === "doctor") {
                return (
                    <DoctorForm
                        selectedUser={selectedUser}
                        heading={<Navigation />}
                        onClickCallback={onClickFormCallback}
                    />
                );
            } else {
                return (
                    <GeneralUserForm
                        selectedUser={selectedUser}
                        heading={<Navigation />}
                        onClickCallback={onClickFormCallback}
                    />
                );
            }
        }
    };

    const Navigation = () => {
        return (
            <div className="flex flex-col gap-4">
                <div className="mt-4 text-center flex flex-row items-center justify-between gap-4">
                    {step > 0 && (
                        <Button
                            onClick={onClickBack}
                            variant="link"
                            size="sm"
                            type="button"
                            className="mr-4 pl-0 flex flex-row items-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back
                        </Button>
                    )}
                    {step > 0 && (
                        <Button
                            disabled={!selectedType}
                            className="flex flex-row items-center gap-2"
                            size="sm"
                            type="submit"
                        >
                            Continue <ArrowRight size={16} />
                        </Button>
                    )}
                </div>
                {selectedType === "doctor" && (
                    <div className="flex flex-col gap-2">
                        <Label className="flex flex-row gap-4 items-center">
                            {"Your unique sign-up code"}
                        </Label>
                        <Input
                            type="text"
                            autoFocus
                            required
                            value={doctorAuthCode}
                            onChange={(e) => setDoctorAuthCode(e.target.value)}
                            placeholder="Sign-up code"
                            className="max-w-screen-sm h-10 bg-white"
                            autoComplete="on"
                            style={{
                                fontSize: 16,
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    let heading = "Let's get your Humloop device & account set up";
    let subHeading =
        "We want to make sure that your Humloop is set up to provide you the best experience possible.";

    if (step === 1) {
        if (selectedType === "doctor") {
            heading = "Hello Doctor!";
            subHeading =
                "With the following details we will be able to personalize your and your patients' Humloop experience.";
        } else {
            heading = "Hello there!";
            subHeading =
                "With the following details we will be able to personalize your Humloop experience.";
        }
    }

    return (
        <div className="max-w-lg flex-auto flex flex-col gap-2 px-1 font-quicksand ">
            <Progress value={progress} className="bg-amber-200" />
            <p className="text-3xl font-bold mt-5">{heading}</p>
            <p className="text-md text-gray-500 font-medium">{subHeading}</p>
            <CurrentForm />
        </div>
    );
};

export default Steps;
