import CryptoJS from 'crypto-js';

const TOTP = {
  /**
   * 生成 TOTP 验证码
   * @param {string} secret - 密钥
   * @param {number} algorithm - 1:SHA1, 2:SHA256, 3:SHA512
   * @param {number} digits - 位数 (6 或 8)
   * @param {number} period - 周期 (30 或 60)
   */
  generate(secret, algorithm = 1, digits = 6, period = 30) {
    try {
      if (!secret) return '------';

      // 将 Base32 密钥转换为字节数组
      const keyUint8 = this.base32ToUint8Array(secret);
      if (!keyUint8) {
        return '------';
      }

      // 计算周期内的计数器值
      const counter = Math.floor(Math.floor(Date.now() / 1000) / period);
      const counterHex = counter.toString(16).padStart(16, '0');
      const counterWords = CryptoJS.enc.Hex.parse(counterHex);
      const keyWords = CryptoJS.lib.WordArray.create(keyUint8);

      // 根据传入的算法选择哈希方式
      let hmac;
      switch (Number(algorithm)) {
        case 2: // SHA256
          hmac = CryptoJS.HmacSHA256(counterWords, keyWords);
          break;
        case 3: // SHA512
          hmac = CryptoJS.HmacSHA512(counterWords, keyWords);
          break;
        case 1: // SHA1
        default:
          hmac = CryptoJS.HmacSHA1(counterWords, keyWords);
          break;
      }

      const hmacHex = hmac.toString(CryptoJS.enc.Hex);

      // 动态截断 (Dynamic Truncation)
      const offset = parseInt(hmacHex.substring(hmacHex.length - 1), 16);
      const binary = parseInt(hmacHex.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff;

      // 返回指定位数的验证码
      return (binary % Math.pow(10, digits)).toString().padStart(digits, '0');
    } catch (e) {
      console.error('TOTP Error:', e);
      return '000000';
    }
  },

  /**
   * 将 Base32 字符串转换为 Uint8Array
   * @param {string} base32 - Base32 编码的密钥
   * @returns {Uint8Array} - 转换后的字节数组
   */
  base32ToUint8Array(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = base32.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
    const output = new Uint8Array((cleaned.length * 5 / 8) | 0);
    let bits = 0, value = 0, index = 0;

    for (let i = 0; i < cleaned.length; i++) {
      const v = alphabet.indexOf(cleaned[i]);
      if (v === -1) {
        return null; // 如果字符不合法，返回 null
      }
      value = (value << 5) | v;
      bits += 5;
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    return output;
  },

  /**
   * 获取当前周期的剩余秒数
   * @param {number} period - 周期 (默认 30)
   * @returns {number} 剩余秒数
   */
  getRemainingSeconds(period = 30) {
    return period - (Math.floor(Date.now() / 1000) % period);
  },
};

export default TOTP;