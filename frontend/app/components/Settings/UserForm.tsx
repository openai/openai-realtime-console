import {
    Form,
    FormControl,
    FormDescription,
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
import {
    userFormAgeDescription,
    userFormAgeLabel,
    userFormPersonaLabel,
    userFormPersonaPlaceholder,
} from "@/lib/data";
import { Button } from "@/components/ui/button";

interface GeneralUserFormProps {
    selectedUser: IUser;
    heading: React.ReactNode;
    onSave: (values: any, userType: "doctor" | "user") => void;
}

export const UserSettingsSchema = z.object({
    supervisee_name: z.string().min(1).max(50),
    supervisee_age: z.number().min(1).max(18),
    supervisee_persona: z.string().max(500).optional(),
    modules: z
        .array(z.enum(["math", "science", "spelling", "general_trivia"]))
        .refine((value) => value.some((item) => item), {
            message: "You have to select at least one item.",
        }),
});

export type GeneralUserInput = z.infer<typeof UserSettingsSchema>;

const GeneralUserForm = forwardRef<
    { submitForm: () => void },
    GeneralUserFormProps
>(({ selectedUser, heading, onSave }, ref) => {
    const form = useForm<GeneralUserInput>({
        defaultValues: {
            supervisee_name: selectedUser?.supervisee_name ?? "",
            supervisee_age: selectedUser?.supervisee_age ?? 0,
            supervisee_persona: selectedUser?.supervisee_persona ?? "",
            modules: selectedUser?.modules ?? [],
        },
    });

    async function onSubmit(values: z.infer<typeof UserSettingsSchema>) {
        onSave(values, "user");
    }

    const handleSave = () => {
        onSave(form.getValues(), "user");
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-8 mb-4"
            >
                {heading}
                <section className="space-y-4 max-w-screen-sm">
                    <h2 className="text-lg font-semibold border-b border-gray-200 pb-2">
                        Basic Info
                    </h2>
                    <div className="flex flex-col gap-6">
                        <FormField
                            control={form.control}
                            name="supervisee_name"
                            render={({ field }) => (
                                <FormItem className="w-full rounded-md">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        {"Your Name"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            // autoFocus
                                            required
                                            placeholder="e.g. John Doe"
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
                        {/* for child age */}
                        <FormField
                            control={form.control}
                            name="supervisee_age"
                            render={({ field }) => (
                                <FormItem className="w-full rounded-md">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        {userFormAgeLabel}
                                    </FormLabel>
                                    <FormDescription>
                                        {userFormAgeDescription}
                                    </FormDescription>
                                    <FormControl>
                                        <Input
                                            // autoFocus
                                            required
                                            placeholder="e.g. 8"
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
                            name="supervisee_persona"
                            render={({ field }) => (
                                <FormItem className="w-full rounded-md">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        {userFormPersonaLabel}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={6}
                                            placeholder={
                                                userFormPersonaPlaceholder
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
                    </div>
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

GeneralUserForm.displayName = "GeneralUserForm";

export default GeneralUserForm;
