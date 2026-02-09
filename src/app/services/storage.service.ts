import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  /**
   * Get an item from local storage
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Set an item in local storage
   * @param key The key to set
   * @param value The value to store
   */
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  /**
   * Remove an item from local storage
   * @param key The key to remove
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all items from local storage
   */
  clear(): void {
    localStorage.clear();
  }
}
