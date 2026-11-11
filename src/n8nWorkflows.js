export const N8N_WORKFLOWS = {
  "edit": {
    "nodes": [
      {
        "id": "0b157f0f-0403-4314-b8b3-3d032b124536",
        "name": "Update row in sheet",
        "type": "googleSheets",
        "position": [
          2944,
          176
        ]
      },
      {
        "id": "06a537b7-1189-4230-b447-84e5adfe453f",
        "name": "Editing Prompts",
        "type": "googleSheets",
        "position": [
          128,
          256
        ]
      },
      {
        "id": "4500c9fb-117c-4328-a073-74a4a167082a",
        "name": "Get Images Data",
        "type": "googleSheets",
        "position": [
          336,
          256
        ]
      },
      {
        "id": "825e86b0-8e8d-4cce-aefa-2428a03ad0e8",
        "name": "Filter Un-edited ones",
        "type": "filter",
        "position": [
          528,
          256
        ]
      },
      {
        "id": "64e3c0b5-cff0-4266-bb7b-08edd8f1c408",
        "name": "loop over data",
        "type": "splitInBatches",
        "position": [
          944,
          256
        ]
      },
      {
        "id": "ef038009-d830-47e5-9d0e-3bae32c557ea",
        "name": "random unique code",
        "type": "code",
        "position": [
          1488,
          32
        ]
      },
      {
        "id": "5834c2eb-784f-4cf8-b4a0-c80ded3d152d",
        "name": "BG image",
        "type": "httpRequest",
        "position": [
          1888,
          32
        ]
      },
      {
        "id": "84a99ecf-6cb8-45c8-97ec-c7b48753f275",
        "name": "Product Image",
        "type": "httpRequest",
        "position": [
          1696,
          368
        ]
      },
      {
        "id": "9e03b09e-959f-474c-a4fa-dd8292688cfb",
        "name": "Merge Images",
        "type": "merge",
        "position": [
          2272,
          176
        ]
      },
      {
        "id": "d2a305e9-e5b9-4dd3-893a-c53d48cc8214",
        "name": "Image Editing",
        "type": "lc:googleGemini",
        "position": [
          2512,
          176
        ]
      },
      {
        "id": "b4e654b9-378c-468a-bebc-84904fd0ab84",
        "name": "Store in S3 Bucket",
        "type": "httpRequest",
        "position": [
          2768,
          176
        ]
      },
      {
        "id": "fc63d8d9-b8f0-4ba0-8862-217c9dc9c4b3",
        "name": "limit1",
        "type": "limit",
        "position": [
          720,
          256
        ]
      },
      {
        "id": "ca697b09-7751-4846-8cc6-72b11555532d",
        "name": "Manual Trigger",
        "type": "manualTrigger",
        "position": [
          -48,
          256
        ]
      }
    ],
    "connections": {
      "Update row in sheet": {
        "main": [
          [
            {
              "node": "loop over data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Editing Prompts": {
        "main": [
          [
            {
              "node": "Get Images Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Images Data": {
        "main": [
          [
            {
              "node": "Filter Un-edited ones",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Filter Un-edited ones": {
        "main": [
          [
            {
              "node": "limit1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "loop over data": {
        "main": [
          [],
          [
            {
              "node": "Product Image",
              "type": "main",
              "index": 0
            },
            {
              "node": "random unique code",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "random unique code": {
        "main": [
          [
            {
              "node": "BG image",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "BG image": {
        "main": [
          [
            {
              "node": "Merge Images",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Product Image": {
        "main": [
          [
            {
              "node": "Merge Images",
              "type": "main",
              "index": 1
            }
          ]
        ]
      },
      "Merge Images": {
        "main": [
          [
            {
              "node": "Image Editing",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Image Editing": {
        "main": [
          [
            {
              "node": "Store in S3 Bucket",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Store in S3 Bucket": {
        "main": [
          [
            {
              "node": "Update row in sheet",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "limit1": {
        "main": [
          [
            {
              "node": "loop over data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Manual Trigger": {
        "main": [
          [
            {
              "node": "Editing Prompts",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  },
  "check": {
    "nodes": [
      {
        "id": "21bedfb7-f0a7-47eb-b7e5-838de7c31139",
        "name": "QC",
        "type": "lc:googleGemini",
        "position": [
          1344,
          1872
        ]
      },
      {
        "id": "ef9f0a45-4004-4ad8-bdbf-68daaf7039d6",
        "name": "If",
        "type": "if",
        "position": [
          1712,
          1872
        ]
      },
      {
        "id": "eeaebc1d-f145-44ad-af96-d243697fa481",
        "name": "QC failed",
        "type": "googleSheets",
        "position": [
          2160,
          1968
        ]
      },
      {
        "id": "cdfcaba0-5248-4031-8c2d-49b04a9b8c39",
        "name": "QC passes",
        "type": "googleSheets",
        "position": [
          2160,
          1648
        ]
      },
      {
        "id": "73758d6d-90af-42d2-af02-733c721e6c63",
        "name": "QC Prompt",
        "type": "googleSheets",
        "position": [
          80,
          1856
        ]
      },
      {
        "id": "2d5c2416-45a3-4141-9773-da53e834884b",
        "name": "Get Edited Data",
        "type": "googleSheets",
        "position": [
          288,
          1856
        ]
      },
      {
        "id": "11bab10a-2faf-4495-b0a7-6620af745b8f",
        "name": "Filter Edited Data",
        "type": "filter",
        "position": [
          480,
          1856
        ]
      },
      {
        "id": "e8094f3d-7a58-453a-9d01-b013a76cd79d",
        "name": "limit",
        "type": "limit",
        "position": [
          688,
          1856
        ]
      },
      {
        "id": "88076fbe-6ec9-44d3-9424-6e71e8949473",
        "name": "loop",
        "type": "splitInBatches",
        "position": [
          928,
          1856
        ]
      }
    ],
    "connections": {
      "QC": {
        "main": [
          [
            {
              "node": "If",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "If": {
        "main": [
          [
            {
              "node": "QC passes",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "QC failed",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "QC failed": {
        "main": [
          [
            {
              "node": "loop",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "QC passes": {
        "main": [
          [
            {
              "node": "loop",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "QC Prompt": {
        "main": [
          [
            {
              "node": "Get Edited Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get Edited Data": {
        "main": [
          [
            {
              "node": "Filter Edited Data",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Filter Edited Data": {
        "main": [
          [
            {
              "node": "limit",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "limit": {
        "main": [
          [
            {
              "node": "loop",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "loop": {
        "main": [
          [],
          [
            {
              "node": "QC",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  },
  "fix": {
    "nodes": [
      {
        "id": "3813e701-555a-4dd0-bdd2-fe30af86557f",
        "name": "Code in JavaScript",
        "type": "code",
        "position": [
          1120,
          2976
        ]
      },
      {
        "id": "e842b833-d9d8-4fbe-bcf1-77ab23f4eec7",
        "name": "background image",
        "type": "httpRequest",
        "position": [
          1488,
          2976
        ]
      },
      {
        "id": "e50632c4-74ed-4813-82b0-3c561314b856",
        "name": "Get row(s) in sheet",
        "type": "googleSheets",
        "position": [
          224,
          3312
        ]
      },
      {
        "id": "0c370dda-30cc-42c1-b1c2-06a4a89a4e88",
        "name": "Loop Over Items",
        "type": "splitInBatches",
        "position": [
          768,
          3312
        ]
      },
      {
        "id": "f21c601f-a79c-4e3d-8d2a-7490b3d45426",
        "name": "Limit",
        "type": "limit",
        "position": [
          576,
          3312
        ]
      },
      {
        "id": "e9b1039e-3d59-4a04-b87d-94b0339a1d83",
        "name": "Merge",
        "type": "merge",
        "position": [
          1792,
          3344
        ]
      },
      {
        "id": "3c8a3930-eb09-481e-8093-4975cdb21301",
        "name": "Schedule Trigger",
        "type": "scheduleTrigger",
        "position": [
          -176,
          3312
        ]
      },
      {
        "id": "94540dd0-3811-435e-8685-3421b94e8f34",
        "name": "Update row in sheet1",
        "type": "googleSheets",
        "position": [
          2608,
          3408
        ]
      },
      {
        "id": "20b755e2-52e7-4809-aa9e-83d9d0add0db",
        "name": "Filter",
        "type": "filter",
        "position": [
          400,
          3312
        ]
      },
      {
        "id": "17adcba0-a715-4025-b8af-8325db6aa8fc",
        "name": "get prompt",
        "type": "googleSheets",
        "position": [
          32,
          3312
        ]
      },
      {
        "id": "bfe99e56-779f-4cb9-9f94-688b2be7e912",
        "name": "store in supabse",
        "type": "httpRequest",
        "position": [
          2416,
          3344
        ]
      },
      {
        "id": "cb8e05d7-561c-47aa-832e-9282253252aa",
        "name": "product image",
        "type": "httpRequest",
        "position": [
          1296,
          3296
        ]
      },
      {
        "id": "072cd453-e962-458a-806a-dc43f617118c",
        "name": "Edit an image1",
        "type": "lc:googleGemini",
        "position": [
          2048,
          3360
        ]
      },
      {
        "id": "d5de1055-94cb-4a40-a1c0-756dedff20d8",
        "name": "failed img",
        "type": "httpRequest",
        "position": [
          1152,
          3648
        ]
      },
      {
        "id": "66b6ecd9-7599-494c-989e-ddf22d7f2c7d",
        "name": "product image2",
        "type": "httpRequest",
        "position": [
          1456,
          3744
        ]
      }
    ],
    "connections": {
      "Code in JavaScript": {
        "main": [
          [
            {
              "node": "background image",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "background image": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Get row(s) in sheet": {
        "main": [
          [
            {
              "node": "Filter",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Loop Over Items": {
        "main": [
          [],
          [
            {
              "node": "product image",
              "type": "main",
              "index": 0
            },
            {
              "node": "Code in JavaScript",
              "type": "main",
              "index": 0
            },
            {
              "node": "failed img",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Limit": {
        "main": [
          [
            {
              "node": "Loop Over Items",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Merge": {
        "main": [
          [
            {
              "node": "Edit an image1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Schedule Trigger": {
        "main": [
          [
            {
              "node": "get prompt",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Update row in sheet1": {
        "main": [
          [
            {
              "node": "Loop Over Items",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Filter": {
        "main": [
          [
            {
              "node": "Limit",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "get prompt": {
        "main": [
          [
            {
              "node": "Get row(s) in sheet",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "store in supabse": {
        "main": [
          [
            {
              "node": "Update row in sheet1",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "product image": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 1
            }
          ]
        ]
      },
      "Edit an image1": {
        "main": [
          [
            {
              "node": "store in supabse",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "failed img": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 2
            }
          ],
          [
            {
              "node": "product image2",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "product image2": {
        "main": [
          [
            {
              "node": "Merge",
              "type": "main",
              "index": 2
            }
          ]
        ]
      }
    }
  }
}
