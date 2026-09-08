export const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SWC${timestamp}${random}`;
};

export const validatePincode = (pincode: string): boolean => {
    // Indian pincode validation (6 digits)
    return /^\d{6}$/.test(pincode);
};

export const validatePhone = (phone: string): boolean => {
    // Indian mobile number validation. Accepts common input formats such as
    // 9701630276, +91 97016 30276, 91-97016-30276, and 09701630276.
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits);
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};
