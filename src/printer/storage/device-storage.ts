/**
 * Device Storage – Persists the last paired printer device info in IndexedDB
 */

import { StoredDevice } from "../types";
import { idbPut, idbGet, idbClear, STORES } from "../db";

const KEY = "last-device";

export class DeviceStorage {
  static async save(device: StoredDevice): Promise<void> {
    await idbPut(STORES.DEVICES, { ...device, id: KEY });
  }

  static async load(): Promise<StoredDevice | undefined> {
    return idbGet<StoredDevice>(STORES.DEVICES, KEY);
  }

  static async clear(): Promise<void> {
    await idbClear(STORES.DEVICES);
  }
}
