export function formatDate(date) {
    // 1. 先處理 null, undefined, 或空字串等無效情況
    if (!date) {
        return '';
    }

    // 2. 如果傳入的已經是字串，我們假設它格式正確，直接回傳日期部分
    //    這能處理從後端傳來的 "1990-01-01"
    if (typeof date === 'string') {
        return date.split('T')[0]; // split('T')[0] 是為了兼容可能出現的 ISO 字串
    }

    // 3. 如果傳入的是 Date 物件，我們才進行格式化
    //    這能處理使用者透過 Calendar 元件新選擇的日期
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 4. 對於其他未知的型別，回傳空字串以策安全
    return '';
}
