const pasoriDevice = {
  443: {
    vendorId: 0x054c,
    productId: 0x01bb,
    modelType: "320",
    modelName: "RC-S320",
    endpointInNum: "",
    endpointOutNum: "",
  },
  737: {
    vendorId: 0x054c,
    productId: 0x02e1,
    modelType: "330",
    modelName: "RC-S330",
    endpointInNum: "",
    endpointOutNum: "",
  },
  1729: {
    vendorId: 0x054c,
    productId: 0x06c1,
    modelType: "380S",
    modelName: "RC-S380/S",
    endpointInNum: "",
    endpointOutNum: "",
  },
  1731: {
    vendorId: 0x054c,
    productId: 0x06c3,
    modelType: "380P",
    modelName: "RC-S380/P",
    endpointInNum: "",
    endpointOutNum: "",
  },
  3528: {
    vendorId: 0x054c,
    productId: 0x0dc8,
    modelType: "300S",
    modelName: "RC-S300/S",
    endpointInNum: "",
    endpointOutNum: "",
  },
  3529: {
    vendorId: 0x054c,
    productId: 0x0dc9,
    modelType: "380P",
    modelName: "RC-S300/P",
    endpointInNum: "",
    endpointOutNum: "",
  },
};

function sleep(msec) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, msec)
  );
}

let seqNumber = 0;

async function send300(device, endpointOut, data) {
  let uint8data = new Uint8Array(data);
  const dataLength = uint8data.length;
  const SLOT_NUMBER = 0x00;
  let reqPacket = new Uint8Array(10 + dataLength);

  reqPacket[0] = 0x6b;
  reqPacket[1] = 255 & dataLength;
  reqPacket[2] = (dataLength >> 8) & 255;
  reqPacket[3] = (dataLength >> 16) & 255;
  reqPacket[4] = (dataLength >> 24) & 255;
  reqPacket[5] = SLOT_NUMBER;
  reqPacket[6] = ++seqNumber;

  0 != dataLength && reqPacket.set(uint8data, 10);
  await device.transferOut(endpointOut, reqPacket);
  await sleep(20);
}

async function send(device, endpointOut, data) {
  let uint8data = new Uint8Array(data);
  await device.transferOut(endpointOut, uint8data);
  await sleep(10);
}

async function receive(device, endpointIn, len) {
  let data = await device.transferIn(endpointIn, len);
  await sleep(10);
  let arr = [];
  for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
    arr.push(data.data.getUint8(i));
  }
  return arr;
}

async function readIdm(device) {
  if (!device.opened) {
    await setupDevice(device);
  }
  let pasoriDeviceModel = pasoriDevice[device.productId];
  let endpointOut = pasoriDeviceModel.endPointOutNum;
  let endpointIn = pasoriDeviceModel.endPointInNum;
  let idm = [];
  if (device.productId === 0x0dc8 || device.productId === 0x0dc9) {
    // RC-S300
    const len = 50;
    // firmware version
    // await send300(device, endpointOut, [0xFF, 0x56, 0x00, 0x00]);
    // await receive(device, endpointIn, len);

    // end transparent
    await send300(
      device,
      endpointOut,
      [0xff, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]
    );
    await receive(device, endpointIn, len);
    // star transparent
    await send300(
      device,
      endpointOut,
      [0xff, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]
    );
    await receive(device, endpointIn, len);
    // rf off
    await send300(
      device,
      endpointOut,
      [0xff, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]
    );
    await receive(device, endpointIn, len);
    // rf on
    await send300(
      device,
      endpointOut,
      [0xff, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]
    );
    await receive(device, endpointIn, len);
    // SwitchProtocolTypeF
    await send300(
      device,
      endpointOut,
      [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]
    );
    await receive(device, endpointIn, len);
    // feLiCa poling
    await send300(
      device,
      endpointOut,
      [
        0xff, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5f, 0x46, 0x04, 0xa0, 0x86,
        0x01, 0x00, 0x95, 0x82, 0x00, 0x06, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00,
        0x00, 0x00, 0x00,
      ]
    );

    const poling_res_f = await receive(device, endpointIn, len);

    if (poling_res_f.length == 46) {
      idm = poling_res_f.slice(26, 34);
    } else {
      return "";
    }
  }
  if (device.productId === 0x06c1 || device.productId === 0x06c3) {
    // RC-S380
    await send(device, endpointOut, [0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x2a, 0x01, 0xff,
        0x00,
      ]
    ); //SetCommandType
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 1");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24,
        0x00,
      ]
    ); //SwitchRF
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 2");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x03, 0x00, 0xfd, 0xd6, 0x06, 0x00, 0x24,
        0x00,
      ]
    ); //SwitchRF
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 3");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x06, 0x00, 0xfa, 0xd6, 0x00, 0x01, 0x01,
        0x0f, 0x01, 0x18, 0x00,
      ]
    ); //InSetRF
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 4");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x28, 0x00, 0xd8, 0xd6, 0x02, 0x00, 0x18,
        0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00,
        0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00,
        0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06,
        0x4b, 0x00,
      ]
    ); //InSetProtocol
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 5");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x04, 0x00, 0xfc, 0xd6, 0x02, 0x00, 0x18,
        0x10, 0x00,
      ]
    ); //InSetProtocol
    await receive(device, endpointIn, 6);
    await receive(device, endpointIn, 13);
    // console.log("session IN 6");
    await send(
      device,
      endpointOut,
      [
        0x00, 0x00, 0xff, 0xff, 0xff, 0x0a, 0x00, 0xf6, 0xd6, 0x04, 0x6e, 0x00,
        0x06, 0x00, 0xff, 0xff, 0x01, 0x00, 0xb3, 0x00,
      ]
    ); //InCommRF
    await receive(device, endpointIn, 6);
    const commRF = await receive(device, endpointIn, 37);
    if (commRF.length == 37) {
      idm = commRF.slice(17, 25);
    } else {
      return "";
    }
  }
  const idmStr = idm.map((v) => v.toString(16).padStart(2, "0")).join("");
  return idmStr;
}

const getEndpoint = (argInterface, argValue) => {
  let retValue = false;
  for (const val of argInterface.alternate.endpoints) {
    if (val.direction == argValue && val.type == "bulk") {
      console.log(val);
      retValue = val;
    }
  }
  return retValue;
};

/**
 * Setup device
 * @param {USBDevice} device
 * @returns {Promise<USBDevice>}
 */
async function setupDevice(device) {
  const modelType = device.productId;
  const pasoriDeviceModel = pasoriDevice[modelType];
  let deviceInterface;

  console.log("setupDevice:", device);
  const confValue = device.configurations[0].configurationValue || 1;
  console.log("configurationValue:", confValue);

  // RC-S300
  if (device.productId === 0x0dc8 || device.productId === 0x0dc9) {
    deviceInterface = device.configuration.interfaces.filter(
      (v) => v.alternate.interfaceClass == 255
    )[0]; // インターフェイス番号
    pasoriDeviceModel.endPointInNum =
      deviceInterface.alternate.endpoints.filter(
        (e) => e.direction == "in"
      )[0].endpointNumber;
    pasoriDeviceModel.endPointOutNum =
      deviceInterface.alternate.endpoints.filter(
        (e) => e.direction == "out"
      )[0].endpointNumber;
  }

  // RC-S380
  if (device.productId === 0x06c1 || device.productId === 0x06c3) {
    deviceInterface = device.configurations[0].interfaces[0]; // インターフェイス番号
    let deviceEndpoint = await getEndpoint(deviceInterface, "in");
    pasoriDeviceModel.endPointInNum = deviceEndpoint.endpointNumber;
    deviceEndpoint = await getEndpoint(deviceInterface, "out");
    pasoriDeviceModel.endPointOutNum = deviceEndpoint.endpointNumber;
  }

  console.log("interfaceNumber:", deviceInterface.interfaceNumber);

  try {
    await device.open(); // デバイスを開く
    await device.selectConfiguration(confValue);
    await device.claimInterface(deviceInterface.interfaceNumber);
  } catch (error) {
    console.error("This device is currently in use or down:", error);
  }
  return device;
}

/**
 * Open Pasori device
 * @returns {Promise<USBDevice>}
 */
function openDevice() {
  return navigator.usb
    .requestDevice({ filters: [{ vendorId: 0x054c }] })
    .then(async (device) => {
      if (device.opened) {
        await closeDevice(device);
      }
      return setupDevice(device);
    });
}

async function closeDevice(device) {
  let confValue = device.configurations[0].configurationValue || 1;
  let interfaceNum = device.configurations[0].interfaces[confValue - 1].interfaceNumber || 0;
  await device.releaseInterface(interfaceNum);
  await device.close();
  return device;
}

export { openDevice, closeDevice, readIdm };
