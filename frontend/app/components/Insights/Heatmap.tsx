"use client";

// install (please try to align the version of installed @nivo packages)
// yarn add @nivo/heatmap
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { FC } from "react";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

type MyResponsiveHeatMapProps = {
    data: HeatMapData[];
};

export const MyResponsiveHeatMap: FC<MyResponsiveHeatMapProps> = ({ data }) => (
    <ResponsiveHeatMap
        data={data}
        margin={{ top: 60, right: 10, bottom: 10, left: 70 }}
        valueFormat=">-.2s"
        axisTop={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -45,
            legend: "",
            legendOffset: 46,
            truncateTickAt: 0,
        }}
        // axisRight={{
        //     tickSize: 5,
        //     tickPadding: 5,
        //     tickRotation: 0,
        //     // legend: "country",
        //     // legendPosition: "middle",
        //     legendOffset: 70,
        //     truncateTickAt: 0,
        // }}
        axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            // legend: "country",
            // legendPosition: "middle",
            legendOffset: -70,
            truncateTickAt: 0,
        }}
        colors={{
            type: "diverging",
            scheme: "yellow_green",
            minValue: -100000,
            maxValue: 100000,
            divergeAt: 0.82,
        }}
        emptyColor="#555555"
        cellComponent="circle"
        sizeVariation={{
            sizes: [0.3, 0.97],
        }}
        // forceSquare
        enableGridX={true}
        enableGridY={true}
        borderWidth={3}
        borderColor="#fdba74"
        // borderColor={{
        //     from: "color",
        //     modifiers: [["darker", 0.5]],
        // }}
        // legends={[
        //     {
        //         anchor: "bottom",
        //         translateX: 0,
        //         translateY: 40,
        //         length: 400,
        //         thickness: 15,
        //         direction: "row",
        //         tickPosition: "after",
        //         tickSize: 3,
        //         tickSpacing: 4,
        //         tickOverlap: false,
        //         tickFormat: ">-.2s",
        //         title: "Value →",
        //         titleAlign: "start",
        //         titleOffset: 4,
        //     },
        // ]}
        theme={{
            axis: {
                ticks: {
                    text: {
                        fontSize: 12, // Change this to your desired font size
                        fontWeight: 600,
                        fill: "#4b5563", // Change this to your desired text color
                    },
                },
                legend: {
                    text: {
                        fontSize: 12, // Change this to your desired font size
                        fontWeight: 600,
                        fill: "#1f2937", // Change this to your desired text color
                    },
                },
            },
        }}
    />
);
