import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";

interface DoctorFormProps {
    selectedUser: IUser;
    heading: React.ReactNode;
    onSave: (values: any, userType: "doctor" | "user") => void;
}

export const doctorSettingsSchema = z.object({
    doctor_name: z.string().min(1).max(50),
    specialization: z.string().min(1).max(500),
    hospital_name: z.string().min(1).max(200),
    favorite_phrases: z.string().min(1).max(200),
});

export type DoctorSettingsInput = z.infer<typeof doctorSettingsSchema>;

const DoctorForm = forwardRef<
    { submitForm: () => void },
    DoctorFormProps
>(({ selectedUser, heading, onSave }, ref) => {
    const userMetadata = selectedUser.user_info
        .user_metadata as IDoctorMetadata;

    const form = useForm<DoctorSettingsInput>({
        defaultValues: {
            doctor_name:
                userMetadata?.doctor_name ?? selectedUser.supervisee_name,
            specialization: userMetadata?.specialization ?? "",
            hospital_name: userMetadata?.hospital_name ?? "",
            favorite_phrases: userMetadata?.favorite_phrases ?? "",
        },
    });

    async function onSubmit(values: z.infer<typeof doctorSettingsSchema>) {
        onSave(values, "doctor");
    }

    const handleSave = () => {
        onSave(form.getValues(), "doctor");
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-8 mb-4 max-w-screen-sm"
            >
                {heading}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">
                        Basic Info
                    </h2>
                    <FormField
                        control={form.control}
                        name="doctor_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    {"Your Name"}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        // autoFocus
                                        required
                                        placeholder="e.g. Dr. John Doe"
                                        {...field}
                                        className="mt-1"
                                        // autoComplete="on"
                                        // style={{
                                        //     fontSize: 16,
                                        // }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">
                        Clinic Details
                    </h2>
                    <FormField
                        control={form.control}
                        name="hospital_name"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    {"Hospital or clinic name(s)"}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        // autoFocus
                                        required
                                        placeholder="e.g. St. Mary's Hospital"
                                        {...field}
                                        // className="max-w-screen-sm h-10 bg-white"
                                        // autoComplete="on"
                                        // style={{
                                        //     fontSize: 16,
                                        // }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="favorite_phrases"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    {"Your favorite phrases"}
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={3}
                                        placeholder={
                                            "e.g. 'You're doing great!' or 'Take a deep breath'"
                                        }
                                        {...field}
                                        // className="max-w-screen-sm bg-white"
                                        // autoComplete="on"
                                        // style={{
                                        //     fontSize: 16,
                                        // }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                            <FormItem className="w-full rounded-md">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    {"Specialization and conditions treated"}
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={3}
                                        placeholder={
                                            "e.g. Pediatrician neurologist or Cardiologist treating heart conditions"
                                        }
                                        {...field}
                                        // className="max-w-screen-sm bg-white"
                                        // autoComplete="on"
                                        // style={{
                                        //     fontSize: 16,
                                        // }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>
                <Button
                variant="default"
                className="rounded-full w-fit mt-4"
                size="sm"
                onClick={handleSave}
                type="submit"
            >
                Save settings
            </Button>
            </form>
        </Form>
    );
});

DoctorForm.displayName = "DoctorForm";

export default DoctorForm;
