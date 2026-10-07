export const batteries = {
  B0005: {
  currentSoh: 82.4,
  cycleCount: 168,
  

    actual: [
      { time: "20", value: 98 },
      { time: "40", value: 96 },
      { time: "60", value: 94 },
      { time: "80", value: 91 },
      { time: "100", value: 88 },
      { time: "120", value: 86 },
      { time: "140", value: 84 },
      { time: "168", value: 82.4 },
    ],

    predicted: [
      { time: "20", value: 98.2 },
      { time: "40", value: 95.7 },
      { time: "60", value: 93.5 },
      { time: "80", value: 91.4 },
      { time: "100", value: 88.5 },
      { time: "120", value: 85.8 },
      { time: "140", value: 83.7 },
      { time: "168", value: 82.1 },
    ],
  },

  B0006: {
    currentSoh: 78.9,
    cycleCount: 160,
    

    actual: [
      { time: "20", value: 97 },
      { time: "40", value: 95 },
      { time: "60", value: 92 },
      { time: "80", value: 89 },
      { time: "100", value: 86 },
      { time: "120", value: 83 },
      { time: "140", value: 81 },
      { time: "160", value: 78.9 },
    ],

    predicted: [
      { time: "20", value: 96.8 },
      { time: "40", value: 94.6 },
      { time: "60", value: 92.4 },
      { time: "80", value: 88.7 },
      { time: "100", value: 85.8 },
      { time: "120", value: 83.5 },
      { time: "140", value: 80.6 },
      { time: "160", value: 79.2 },
    ],
  },

  B0007: {
    currentSoh: 85.1,
    cycleCount: 155,
    

    actual: [
      { time: "20", value: 98 },
      { time: "40", value: 97 },
      { time: "60", value: 95 },
      { time: "80", value: 93 },
      { time: "100", value: 91 },
      { time: "120", value: 89 },
      { time: "140", value: 87 },
      { time: "155", value: 85.1 },
    ],

    predicted: [
      { time: "20", value: 97.8 },
      { time: "40", value: 96.7 },
      { time: "60", value: 94.8 },
      { time: "80", value: 92.6 },
      { time: "100", value: 90.8 },
      { time: "120", value: 88.7 },
      { time: "140", value: 86.8 },
      { time: "155", value: 85.4 },
    ],
  },

  B0018: {
    currentSoh: 74.6,
    cycleCount: 145,
    

    actual: [
      { time: "20", value: 96 },
      { time: "40", value: 93 },
      { time: "60", value: 90 },
      { time: "80", value: 86 },
      { time: "100", value: 82 },
      { time: "120", value: 78 },
      { time: "135", value: 76 },
      { time: "145", value: 74.6 },
    ],

    predicted: [
      { time: "20", value: 95.5 },
      { time: "40", value: 93.4 },
      { time: "60", value: 89.6 },
      { time: "80", value: 85.7 },
      { time: "100", value: 82.5 },
      { time: "120", value: 77.6 },
      { time: "135", value: 75.4 },
      { time: "145", value: 74.2 },
    ],
  },

  B0036: {
    currentSoh: 69.8,
    cycleCount: 130,
    


    actual: [
      { time: "20", value: 96 },
      { time: "40", value: 93 },
      { time: "60", value: 89 },
      { time: "80", value: 84 },
      { time: "100", value: 79 },
      { time: "110", value: 75 },
      { time: "120", value: 72 },
      { time: "130", value: 69.8 },
    ],

    predicted: [
      { time: "20", value: 95.8 },
      { time: "40", value: 92.5 },
      { time: "60", value: 89.4 },
      { time: "80", value: 83.5 },
      { time: "100", value: 78.5 },
      { time: "110", value: 75.6 },
      { time: "120", value: 71.5 },
      { time: "130", value: 70.2 },
    ],
  },
}

export const overviewData = {
  batteryCount: Object.keys(batteries).length,
  selectedBattery: "B0005",
}