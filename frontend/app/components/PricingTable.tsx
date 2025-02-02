"use client";
import { User } from "@supabase/supabase-js";
import React, { useEffect } from "react";

interface StripePricingTableProps
    extends React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
    > {
    "pricing-table-id": string;
    "publishable-key": string;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "stripe-pricing-table": StripePricingTableProps;
        }
    }
}

type Props = {
    user?: User;
};

const StripePricingTable = ({ user }: Props) => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/pricing-table.js";
        script.async = true;

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="flex flex-1 flex-col w-full">
            <stripe-pricing-table
                pricing-table-id="prctbl_1QFF80LTb7Djmo1RzOnsbKFy"
                publishable-key="pk_live_51Q81deLTb7Djmo1RZPPW4O52di1bjPKbsdUaE25vhQAEMzJ4u0s0UoGx3tDmbR3m4Ir4uBDXomwFjyUgAvHvXZnE00too8og1H"
            ></stripe-pricing-table>
        </div>
    );
};

export default StripePricingTable;
