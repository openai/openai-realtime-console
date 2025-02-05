// export const dynamic = "force-dynamic";

import { getOpenGraphMetadata } from "@/lib/utils";
import OurAddressSign from "../components/OurAddressSign";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    ...getOpenGraphMetadata("Privacy Policy"),
};

export default async function Index() {
    return (
        <div className="flex w-full  max-w-xl mx-auto mt-8 flex-col lg:w-1/2 px-4  gap-2 text-left m-2">
            <p className="font-semibold text-2xl">
                Privacy Policy for Elato AI
            </p>
            <p className="font-light text-md">Last Updated: 9/29/24</p>
            <div className="flex flex-col gap-4 my-4">
                <p>
                    {`Welcome to Elato AI ("we," "us," "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy outlines how we handle, store, and use the information you provide us when you use our website, `}
                    <a
                        href="https://www.elatoai.com"
                        className="text-blue-400 underline"
                        target="_blank"
                    >
                        https://www.elatoai.com
                    </a>
                    {`, and our services.`}
                </p>
                <p className="text-lg font-semibold">
                    {" "}
                    1. Information We Collect{" "}
                </p>{" "}
                <p>
                    {" "}
                    We collect information that you voluntarily provide to us
                    when registering on our site, purchasing our hardware,
                    downloading our software, accessing our github repo, or
                    interacting with our AI characters. This information may
                    include:{" "}
                </p>{" "}
                <ul style={{ listStyleType: "initial" }} className="ml-8">
                    {" "}
                    <li>
                        {" "}
                        <strong>Personal Information:</strong> Your name, email
                        address, shipping address, and payment details for
                        transactions and communications.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>User Interactions:</strong> Data generated from
                        your interactions with our AI characters, such as text
                        inputs, voice recordings, and usage patterns.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>Open-Source Contributions:</strong> If you
                        contribute to our open-source codebase, we may collect
                        your username and any information you include in your
                        contributions.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>Feedback and Support:</strong> Information you
                        provide when seeking support or giving feedback,
                        including contact details and the content of your
                        communications.{" "}
                    </li>{" "}
                </ul>{" "}
                <p className="text-lg font-semibold">
                    {" "}
                    2. How We Use Your Information{" "}
                </p>{" "}
                <p>
                    The information we collect is used in the following ways:
                </p>{" "}
                <ul style={{ listStyleType: "initial" }} className="ml-8">
                    {" "}
                    <li>
                        {" "}
                        <strong>
                            To Provide and Improve Our Services:
                        </strong>{" "}
                        Enhancing the performance of our hardware and software,
                        personalizing user experiences, and improving AI
                        interactions based on usage data.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>To Process Transactions:</strong> Handling
                        payments, orders, deliveries, and related
                        communications.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>To Communicate with You:</strong> Sending
                        updates, security alerts, and administrative messages.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>
                            To Support Open-Source Collaboration:
                        </strong>{" "}
                        Managing and showcasing contributions to our open-source
                        projects, including attributing work to contributors.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>To Ensure Security and Compliance:</strong>{" "}
                        Monitoring for fraudulent activities, enforcing our
                        terms, and complying with legal obligations.{" "}
                    </li>{" "}
                    <li>
                        {" "}
                        <strong>To Analyze and Understand Usage:</strong>{" "}
                        Gathering insights to improve our platform, develop new
                        features, and make informed decisions.{" "}
                    </li>{" "}
                </ul>
                <p className="text-lg font-semibold">
                    3. How We Protect Your Information
                </p>
                <p>
                    We implement a variety of security measures to maintain the
                    safety of your personal information. Your personal
                    information is contained behind secured networks and is only
                    accessible by a limited number of persons who have special
                    access rights and are required to keep the information
                    confidential.
                </p>
                <p className="text-lg font-semibold">
                    4. Sharing Your Personal Information
                </p>
                <p>
                    We do not sell, trade, or otherwise transfer your personally
                    identifiable information to outside parties, except when we
                    believe release is appropriate to comply with the law,
                    enforce our site policies, or protect ours or others&apos;
                    rights, property, or safety.
                </p>
                <p className="text-lg font-semibold">5. Third-Party Services</p>
                <p>
                    We currently do not offer any third party services on our
                    site.
                </p>
                <p className="text-lg font-semibold">6. Your Consent</p>
                <p>
                    By using our site and services, you consent to our privacy
                    policy.
                </p>
                <p className="text-lg font-semibold">
                    7. Changes to Our Privacy Policy
                </p>
                <p>
                    We reserve the right to update this privacy policy at any
                    time. When we do, we will post a notification on our
                    website. Your continued use of the site and services
                    following the posting of changes to this policy will be
                    deemed your acceptance of those changes.
                </p>
                <p className="text-lg font-semibold">8. Contacting Us</p>
                <p>
                    If there are any questions regarding this privacy policy,
                    you may contact me using the information below:
                </p>
                <OurAddressSign />
            </div>
        </div>
    );
}
