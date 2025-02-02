"use client";

// install (please try to align the version of installed @nivo packages)
// yarn add @nivo/bar
import { ResponsiveBar } from "@nivo/bar";
import { FC } from "react";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

type MyResponsiveBarProps = {
    data: BarData[];
    filter: string;
};

export const MyResponsiveBar: FC<MyResponsiveBarProps> = ({ data, filter }) => {
    // Determine the keys based on the filter
    let currentPeriodLabel = "Current Period";
    let previousPeriodLabel = "Previous Period";

    if (filter === "days") {
        currentPeriodLabel = "Today";
        previousPeriodLabel = "Yesterday";
    } else if (filter === "weeks") {
        currentPeriodLabel = "This month";
        previousPeriodLabel = "Last month";
    }

    const keys = [currentPeriodLabel, previousPeriodLabel];

    return (
        <ResponsiveBar
            data={data}
            keys={keys}
            indexBy="emotion"
            margin={{ top: 20, right: 54, bottom: 80, left: 55 }}
            padding={0.3}
            groupMode="grouped"
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            // // colors={{ scheme: "nivo" }}
            colors={["#fbbf24", "#c084fc"]}
            borderRadius={5}
            borderColor={{
                from: "color",
                modifiers: [["darker", 1.6]],
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 30,
                // legend: "country",
                legendPosition: "middle",
                legendOffset: 32,
                truncateTickAt: 0,
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Score (%)",
                legendPosition: "middle",
                legendOffset: -50,
                truncateTickAt: 0,
            }}
            enableGridY={true}
            labelSkipWidth={20}
            labelSkipHeight={12}
            labelTextColor="white"
            // // labelTextColor={{
            // //     from: "color",
            // //     modifiers: [["brighter", 3]],
            // // }}
            legends={[
                {
                    dataFrom: "keys",
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateX: 0,
                    translateY: 80,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: "left-to-right",
                    itemOpacity: 1,
                    symbolSize: 16,
                    symbolShape: "circle",
                    effects: [
                        {
                            on: "hover",
                            style: {
                                itemTextColor: "#000",
                            },
                        },
                    ],
                },
            ]}
            // role="application"
            // ariaLabel="Nivo bar chart demo"
            barAriaLabel={(e) =>
                `${e.id}: ${e.formattedValue} in emotion: ${e.indexValue}`
            }
            theme={{
                axis: {
                    legend: {
                        text: {
                            fontSize: 12,
                            fontWeight: 600,
                            fill: "#4b5563",
                        },
                    },
                    ticks: {
                        text: {
                            fontSize: 12,
                            fontWeight: 500,
                            fill: "#4b5563",
                        },
                    },
                },
                legends: {
                    text: {
                        fontSize: 12,
                        fontWeight: 600,
                        fill: "#4b5563",
                    },
                },
            }}
        />
    );
};
