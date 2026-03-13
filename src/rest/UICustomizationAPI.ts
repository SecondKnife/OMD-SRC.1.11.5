/*
 *  Copyright 2025 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { AxiosResponse } from 'axios';
import axiosClient from '.';
import { UICustomization } from '../generated/system/ui/uiCustomization';

const BASE_URL = 'uiCustomization';

/**
 * Fetch global UI Customization settings
 * @returns Promise containing UI Customization data
 */
export const getGlobalUICustomization = async (): Promise<UICustomization> => {
  const response = await axiosClient.get<UICustomization>(`${BASE_URL}`);
  return response.data;
};

/**
 * Fetch specific UI Customization by UID
 * @param uid - The UID of the UI Customization to fetch
 * @returns Promise containing UI Customization data
 */
export const getUICustomizationByUID = async (
  uid: string
): Promise<UICustomization> => {
  const response = await axiosClient.get<UICustomization>(
    `${BASE_URL}/${uid}`
  );
  return response.data;
};

/**
 * Update UI Customization with JSON Patch operations
 * @param uid - The UID of the UI Customization to update
 * @param operations - JSON Patch operations
 * @returns Promise containing updated UI Customization data
 */
export const patchUICustomization = async (
  uid: string,
  operations: Array<{
    op: 'add' | 'remove' | 'replace';
    path: string;
    value?: any;
  }>
): Promise<UICustomization> => {
  const response = await axiosClient.patch<
    Array<{ op: string; path: string; value?: any }>,
    AxiosResponse<UICustomization>
  >(`${BASE_URL}/${uid}`, operations, {
    headers: {
      'Content-Type': 'application/json-patch+json',
    },
  });
  return response.data;
};

/**
 * Delete UI Customization
 * @param uid - The UID of the UI Customization to delete
 */
export const deleteUICustomization = async (uid: string): Promise<void> => {
  await axiosClient.delete(`${BASE_URL}/${uid}`);
};
