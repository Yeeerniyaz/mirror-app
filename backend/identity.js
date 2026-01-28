import { app } from "electron";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const ID_FILE_PATH = path.join(app.getPath('userData'), 'device_id.txt');

export const getDeviceId = () => {
  try {
    if (fs.existsSync(ID_FILE_PATH)) {
      const id = fs.readFileSync(ID_FILE_PATH, 'utf-8').trim();
      console.log('🔹 DEVICE ID LOADED:', id);
      return id;
    } else {
      const newId = 'v-' + uuidv4().slice(0, 8);
      fs.writeFileSync(ID_FILE_PATH, newId);
      console.log('🔹 NEW DEVICE ID CREATED:', newId);
      return newId;
    }
  } catch (e) {
    console.error('ID Error:', e);
    return 'v-error';
  }
};