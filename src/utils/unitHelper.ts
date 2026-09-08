/**
 * 将表示数据大小的字符串（如 '1.5MB', '128*1024gb'）转换为字节数。
 * @param str - 输入的字符串。
 * @returns - 计算出的字节数（number）。如果无法解析，则返回 0。
 * @example
 * stringToBytes('1MB');        // 1048576
 * stringToBytes('1 MB');        // 1048576
 * stringToBytes('5.4MB');      // 5662310.4
 * stringToBytes('6,222,765 MB'); // 6525139624935
 * stringToBytes('128*1024gb'); // 140737488355328
 * stringToBytes('1e3kb');       // 1024000 (1000 * 1024)
 * stringToBytes('0.2gb');       // 214748364.8
 * stringToBytes('1024');        // 1024 (默认为字节)
 * stringToBytes('1tb');         // 1099511627776
 */
export function stringToBytes(str: string): number {
  if (typeof str !== "string" || str.length === 0 || str.length > 1024) {
    return 0;
  }
  // 定义单位和它们的字节倍数 (使用 1024 为基数)
  const units: { [key: string]: number } = {
    b: 1,
    byte: 1,
    bytes: 1,
    k: 1024,
    kb: 1024,
    kib: 1024,
    kilobyte: 1024,
    m: 1024 ** 2,
    mb: 1024 ** 2,
    mib: 1024 ** 2,
    megabyte: 1024 ** 2,
    g: 1024 ** 3,
    gb: 1024 ** 3,
    gib: 1024 ** 3,
    gigabyte: 1024 ** 3,
    t: 1024 ** 4,
    tb: 1024 ** 4,
    tib: 1024 ** 4,
    terabyte: 1024 ** 4,
    p: 1024 ** 5,
    pb: 1024 ** 5,
    pib: 1024 ** 5,
    petabyte: 1024 ** 5,
  };

  // 1. 预处理字符串：转小写，移除逗号和空格
  const cleanStr = str.toLowerCase().replace(/,/g, "").replace(/\s/g, "");
  if (!cleanStr) return 0;

  // 2. 分离单位和数值
  // 按长度降序排序单位，以优先匹配长单位（如 'kb' 而不是 'b'）
  const unitKeys = Object.keys(units).sort((a, b) => b.length - a.length);
  const unitRegex = new RegExp(`(${unitKeys.join("|")})$`);

  let unit = "b"; // 默认为 byte
  let numericPart = cleanStr;

  const match = cleanStr.match(unitRegex);
  if (match) {
    unit = match[1];
    // 从字符串中移除单位，得到纯数值部分
    numericPart = cleanStr.substring(0, cleanStr.length - unit.length);
  }

  // 如果数值部分为空（例如输入 "kb"），则认为数值是 1
  if (numericPart === "") {
    numericPart = "1";
  }

  // Only decimal/scientific numbers joined by multiplication are accepted.
  // Never evaluate API data as JavaScript, even after stripping units.
  const numberPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/;
  let value = 1;
  for (const factor of numericPart.split("*")) {
    if (!numberPattern.test(factor)) return 0;
    const number = Number(factor);
    if (!Number.isFinite(number)) return 0;
    value *= number;
    if (!Number.isFinite(value)) return 0;
  }

  const bytes = Math.round(value * units[unit]);
  return Number.isSafeInteger(bytes) && bytes >= 0 ? bytes : 0;
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    // 单位为B，不显示小数
    return `${Math.round(size)} ${units[unitIndex]}`;
  } else if (unitIndex >= 2 && bytes >= 1024**3) {
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  } else if (size > 99.99) {
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  } else {
    // 小于等于两位数，显示2位小数
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
