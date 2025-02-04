"use client";

import { ArrowRight, Building2, Hospital, User } from "lucide-react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";

type TUserType = "doctor" | "user" | "business";

interface IUserType {
    type: TUserType;
    title: string;
    icon: React.ReactNode;
    name: string;
    disabled?: boolean;
}

const UserTypes: IUserType[] = [
    {
        type: "user",
        name: "Personal user",
        title: "You are looking to use Elato for personal use",
        icon: <User />,
    },
    {
        type: "doctor",
        name: "Doctor",
        title: "You are a licensed doctor or physician",
        icon: <Hospital />,
    },
    {
        type: "business",
        name: "Business",
        icon: <Building2 />,
        title: "You are a business or organization",
        disabled: true,
    },
];

const UserType: React.FC<{
    selectedUser: IUser;
    selectedType: TUserType | null;
    onSelectType: (type: TUserType) => void;
}> = ({ selectedType, onSelectType, selectedUser }) => {
    const onPickType = async (userType: IUserType) => {
        if (!userType.disabled) {
            onSelectType(userType.type);
        }
    };

    return (
        <div className="mt-4">
            <h1 className="text-xl font-medium my-4 inline">
                You are a <ArrowRight className="inline-block" />{" "}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 mt-2 gap-6">
                {UserTypes.map((userType) => (
                    <Card
                        key={userType.type}
                        className={`relative overflow-hidden transition-all ${
                            userType.disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-lg cursor-pointer"
                        } ${
                            selectedType === userType.type
                                ? "ring-2 ring-primary"
                                : ""
                        }`}
                        onClick={() => {
                            onPickType(userType);
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 p-3 bg-primary/10 rounded-full">
                                    {userType.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {userType.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {userType.title}
                                </p>
                            </div>
                        </CardContent>
                        {userType.disabled && (
                            <Badge
                                variant="secondary"
                                className="text-xs absolute top-2 left-2 rounded-sm font-medium text-muted-foreground"
                            >
                                Coming Soon
                            </Badge>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default UserType;
