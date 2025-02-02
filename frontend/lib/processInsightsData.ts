import { startOfDay, subDays, endOfDay } from "date-fns";
import { generateSuggestion } from "./azureOpenai";

export const positiveEmotions = [
  "joy",
  "surprise",
  "admiration",
  "amusement",
  "approval",
  "caring",
  "excitement",
  "gratitude",
  "joy",
  "love",
  "optimism",
  "pride",
];

export const negativeEmotions = [
  "sadness",
  "anger",
  "annoyance",
  "confusion",
  "disappointment",
  "disapproval",
  "disgust",
  "embarrassment",
  "fear",
  "grief",
  "nervousness",
  "remorse",
  "sadness",
];

export const neutralEmotions = [
  "curiosity",
  "desire",
  "realization",
  "surprise",
  "neutral",
];

export const processData = async (
  rawData: InsightsConversation[],
  filter: string
): Promise<ProcessedData> => {
  // Perform your heavy computations here

  // // loop rawData and print the created_at
  // rawData.forEach((item) => {
  //     // console.log("created_at: ", item.created_at);
  // });
  // sort the rawData by created_at (oldest first)

  rawData.sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  let currentPeriod = new Date();
  let previousPeriod = subDays(currentPeriod, 1);

  const previousPeriodData = filterDataByDate(rawData, previousPeriod);
  const currentPeriodData = filterDataByDate(rawData, currentPeriod);
  // // console.log(previousPeriodData);

  const { prevAvgSorted, curAvgSorted } = getSortedAvgData(
    previousPeriodData,
    currentPeriodData,
    2
  );

  const cardData = getCardsData(prevAvgSorted, curAvgSorted);
  const barData = getBarData(prevAvgSorted, curAvgSorted, 10, filter);

  const { lineData, pieData } = getPieLinedata(rawData);

  const suggestions: string | undefined = await generateSuggestion(
    cardData,
    barData,
    lineData,
    pieData
  );

  return {
    cardData,
    barData,
    lineData,
    pieData,
    suggestions,
  };
};

const filterDataByDate = (
  data: InsightsConversation[],
  date: Date
): InsightsConversation[] => {
  const targetDate = startOfDay(date);

  return data.filter((item) => {
    const createdAt = new Date(item.created_at);
    const createdDate = startOfDay(createdAt);
    return createdDate.getTime() === targetDate.getTime();
  });
};

const averages = (data: InsightsConversation[]): { [key: string]: number } => {
  const scoresSum: { [key: string]: number } = {};
  const scoresCount: { [key: string]: number } = {};

  data.forEach((item) => {
    if (item.metadata && item.metadata.scores) {
      for (const [key, value] of Object.entries(item.metadata.scores)) {
        if (scoresSum[key]) {
          scoresSum[key] += value as number;
          scoresCount[key] += 1;
        } else {
          scoresSum[key] = value as number;
          scoresCount[key] = 1;
        }
      }
    }
  });

  // console.log("scoresSum: ", scoresSum);

  const averages: { [key: string]: number } = {};
  for (const [key, value] of Object.entries(scoresSum)) {
    averages[key] = value / scoresCount[key];
  }

  return averages;
};

const getCardsData = (
  prevAvg: { [key: string]: number },
  curAvg: { [key: string]: number }
): CardData | null => {
  const changes: { [key: string]: number } = {};

  const cardData: { [key: string]: any } = {};

  for (const key of Object.keys(curAvg)) {
    if (prevAvg[key] !== undefined) {
      const change = ((curAvg[key] - prevAvg[key]) / prevAvg[key]) * 100;
      changes[key] = change;
    }
  }

  const changesSorted = Object.fromEntries(
    Object.entries(changes).sort(([, a], [, b]) => b - a)
  );

  const curAvgEntries = Object.entries(curAvg);
  const [firstCurAvg, secondCurAvg] = curAvgEntries;

  const changesEntries = Object.entries(changesSorted);
  //   // console.log("changesEntries", changesEntries, changesEntries.length);

  if (changesEntries.length === 0) {
    if (firstCurAvg) {
      //   // console.log("firstCurAvg", firstCurAvg);
      cardData["main_emotion_1"] = {
        title: firstCurAvg[0],
        value: roundDecimal(firstCurAvg[1] as number),
        change: null,
      };

      cardData["main_emotion_2"] = {
        title: secondCurAvg[0],
        value: roundDecimal(secondCurAvg[1] as number),
        change: null,
      };

      cardData["change_1"] = {
        title: "null",
        value: 0,
        change: 0,
      };

      cardData["change_2"] = {
        title: "null",
        value: 0,
        change: 0,
      };
      return cardData;
    } else {
      return null;
    }
  }

  let firstChange: [string, number];
  let lastChange: [string, number];

  if (changesEntries[0][1] < 0) {
    firstChange = changesEntries[changesEntries.length - 1];
    lastChange = changesEntries[changesEntries.length - 2];
  } else if (changesEntries[changesEntries.length - 1][1] > 0) {
    firstChange = changesEntries[0];
    lastChange = changesEntries[1];
  } else {
    firstChange = changesEntries[0];
    lastChange = changesEntries[changesEntries.length - 1];
  }

  //   // console.log("firstChange", firstChange);

  cardData["main_emotion_1"] = {
    title: firstCurAvg[0],
    value: roundDecimal(firstCurAvg[1] as number),
    change: roundDecimal(changesSorted[firstCurAvg[0]]),
  };

  cardData["main_emotion_2"] = {
    title: secondCurAvg[0],
    value: roundDecimal(secondCurAvg[1] as number),
    change: roundDecimal(changesSorted[secondCurAvg[0]]),
  };

  cardData["change_1"] = {
    title: firstChange[0],
    value: roundDecimal(curAvg[firstChange[0]]),
    change: roundDecimal(firstChange[1]),
  };

  cardData["change_2"] = {
    title: lastChange[0],
    value: roundDecimal(curAvg[lastChange[0]]),
    change: roundDecimal(lastChange[1]),
  };

  return cardData;
};

const getBarData = (
  prevAvg: { [key: string]: number },
  curAvg: { [key: string]: number },
  topN: number,
  filter: string
): BarData[] => {
  // Get first N of curAvg data
  const curAvgEntries = Object.entries(curAvg);
  const curAvgTopN = curAvgEntries.slice(0, topN);

  // Determine the labels based on the filter
  let currentPeriodLabel = "Current Period";
  let previousPeriodLabel = "Previous Period";

  if (filter === "days") {
    currentPeriodLabel = "Today";
    previousPeriodLabel = "Yesterday";
  } else if (filter === "weeks") {
    currentPeriodLabel = "This month";
    previousPeriodLabel = "Last month";
  }

  // Map through curAvgTopN to create the desired schema
  const barData = curAvgTopN.map(([emotion, currentPeriodValue]) => {
    const prevPeriodValue =
      prevAvg[emotion] !== undefined ? prevAvg[emotion] : 0;
    return {
      emotion,
      [currentPeriodLabel]: roundDecimal(currentPeriodValue) ?? 0, // Ensure this is a number
      [previousPeriodLabel]: roundDecimal(prevPeriodValue) ?? 0, // Ensure this is a number
    };
  });

  return barData;
};

const getSortedAvgData = (
  prevData: InsightsConversation[],
  curData: InsightsConversation[],
  topN: number
) => {
  const prevAvg = averages(prevData);
  // console.log("curData: ", curData);
  const curAvg = averages(curData);

  const prevAvgSorted = Object.fromEntries(
    Object.entries(prevAvg).sort(([, a], [, b]) => b - a)
  );

  const curAvgSorted = Object.fromEntries(
    Object.entries(curAvg).sort(([, a], [, b]) => b - a)
  );

  // console.log("prevAvg: ", prevAvgSorted);
  // console.log("curAvg: ", curAvgSorted);
  // sum of all values in curAvgSorted
  const sum = Object.values(curAvgSorted).reduce((a, b) => a + b, 0);
  // console.log("sum: ", sum);

  return { prevAvgSorted, curAvgSorted };
};

const roundDecimal = (num: number | null): number | null => {
  if (num === null) {
    return null;
  }
  if (num > 100 || num < -100) {
    return Math.round(num);
  } else if (num > 10 || num < -10) {
    return Math.round(num * 10) / 10;
  } else {
    return Math.round(num * 100) / 100;
  }
};

const safeGetY = (
  data: { x: string; y: number | null }[],
  idx: number
): number | null => {
  return data[idx] ? data[idx].y : null;
};

export const getPieLinedata = (
  data: InsightsConversation[]
): { lineData: LineData[]; pieData: PieData[] } => {
  if (data.length === 0) {
    return { lineData: [], pieData: [] };
  }

  const dailyScores: {
    [date: string]: {
      positive: number[];
      negative: number[];
      neutral: number[];
    };
  } = {};

  data.forEach((entry) => {
    const date = new Date(entry.created_at).toISOString().split("T")[0];
    if (!dailyScores[date]) {
      dailyScores[date] = { positive: [], negative: [], neutral: [] };
    }

    if (entry.metadata && entry.metadata.scores) {
      Object.keys(entry.metadata.scores).forEach((emotion) => {
        const score = entry.metadata.scores[emotion];
        if (typeof score === "number") {
          if (positiveEmotions.includes(emotion)) {
            dailyScores[date].positive.push(score);
          } else if (negativeEmotions.includes(emotion)) {
            dailyScores[date].negative.push(score);
          } else if (neutralEmotions.includes(emotion)) {
            dailyScores[date].neutral.push(score);
          }
        }
      });
    } else {
      dailyScores[date].positive.push(0);
      dailyScores[date].negative.push(0);
      dailyScores[date].neutral.push(0);
    }
  });

  const lineData: LineData[] = [
    { id: "Negative", name: "Negative", data: [] },
    { id: "Neutral", name: "Neutral", data: [] },
    { id: "Positive", name: "Positive", data: [] },
  ];

  const pieData: PieData[] = [];

  Object.keys(dailyScores).forEach((date) => {
    const positiveScores = dailyScores[date].positive;
    const negativeScores = dailyScores[date].negative;
    const neutralScores = dailyScores[date].neutral;

    // calculate average for each emotion
    const average = (scores: number[]) => {
      if (scores.length === 0) {
        return 0;
      }
      return scores.reduce((a, b) => a + b) / scores.length;
    };

    const positiveAverage = average(positiveScores);
    const negativeAverage = average(negativeScores);
    const neutralAverage = average(neutralScores);

    // console.log(positiveAverage, negativeAverage, neutralAverage);

    const totalSum = positiveAverage + negativeAverage + neutralAverage;

    const normalizedPositive = positiveAverage / totalSum || null;
    const normalizedNegative = negativeAverage / totalSum || null;
    const normalizedNeutral = neutralAverage / totalSum || null;

    lineData[0].data.push({ x: date, y: normalizedNegative });
    lineData[1].data.push({ x: date, y: normalizedNeutral });
    lineData[2].data.push({ x: date, y: normalizedPositive });
  });

  // sort lineData by date
  // lineData.forEach((data) => {
  //     data.data.sort((a, b) => {
  //         return new Date(a.x).getTime() - new Date(b.x).getTime();
  //     });
  // });

  const idx = lineData[0].data.length - 1;
  if (idx >= 0) {
    pieData.push(
      {
        id: "Positive",
        label: "Positive",
        value: roundDecimal(safeGetY(lineData[2].data, idx)),
      },
      {
        id: "Neutral",
        label: "Neutral",
        value: roundDecimal(safeGetY(lineData[1].data, idx)),
      },
      {
        id: "Negative",
        label: "Negative",
        value: roundDecimal(safeGetY(lineData[0].data, idx)),
      }
    );
  }

  return { lineData, pieData };
};
