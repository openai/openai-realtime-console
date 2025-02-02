"use client";
// install (please try to align the version of installed @nivo packages)
// yarn add @nivo/bar
import { ResponsivePie } from "@nivo/pie";
import { FC } from "react";

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.

// const favorit = localFont({
//   src: "./fonts/ABCFavorit-Bold.woff2",
//   variable: "--font-favorit",
// });

// const fonts = `${favorit.variable}`;

type MyResponsivePieProps = {
  data: PieData[];
};

// Define the theme object
const theme = {
  legends: {
    text: {
      fontSize: 12, // Change this value to your desired font size
      fontWeight: 600,
      // fontFamily: fonts,
    },
  },
  labels: {
    text: {
      fontSize: 16, // Change this value to your desired font size for the labels inside the pie
      fontWeight: 700,
      // fontFamily: fonts,
    },
  },
};

export const MyResponsivePie: FC<MyResponsivePieProps> = ({ data }) => (
  <ResponsivePie
    data={data}
    margin={{ top: 15, right: 5, bottom: 40, left: 5 }}
    innerRadius={0.5}
    padAngle={0.7}
    cornerRadius={3}
    activeOuterRadiusOffset={4}
    borderWidth={1}
    borderColor={{
      from: "color",
      modifiers: [["darker", 0.2]],
    }}
    enableArcLinkLabels={false}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="#333333"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: "color" }}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor="#fff"
    arcLabel={(d) => `${d.value.toFixed(2)}%`} // Display value in percentage
    // defs={[
    //     {
    //         id: "dots",
    //         type: "patternDots",
    //         background: "inherit",
    //         color: "rgba(255, 255, 255, 0.3)",
    //         size: 4,
    //         padding: 1,
    //         stagger: true,
    //     },
    //     {
    //         id: "lines",
    //         type: "patternLines",
    //         background: "inherit",
    //         color: "rgba(255, 255, 255, 0.3)",
    //         rotation: -45,
    //         lineWidth: 6,
    //         spacing: 10,
    //     },
    // ]}
    fill={[
      {
        match: {
          id: "Negative",
        },
        id: "dots",
      },
      {
        match: {
          id: "Positive",
        },
        id: "lines",
      },
    ]}
    legends={[
      {
        anchor: "bottom",
        direction: "row",
        justify: false,
        translateX: 2,
        translateY: 40,
        itemsSpacing: 4,
        itemWidth: 80,
        itemHeight: 18,
        itemTextColor: "#4b5563",
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
    theme={theme} // Apply the theme here
    colors={["#4ade80", "#d6d3d1", "#fb7185"]}
  />
);
