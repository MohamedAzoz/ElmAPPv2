import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  set(key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
  }
  get(key: string) {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }
  remove(key: string) {
    localStorage.removeItem(key);
  }
  deleteAllButThis() {
    const keysToKeep = [
      'rate_limit_login_end',
      'rate_limit_login_msg',
      'rate_limit_test_end',
      'rate_limit_test_msg',
      'rate_limit_global_end',
      'rate_limit_global_msg',
      'theme',
      'lang',
      'isDark',
    ];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
  clear() {
    localStorage.clear();
  }
}
