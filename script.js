// DOM要素の取得
const passwordText = document.getElementById('passwordText');
const copyBtn = document.getElementById('copyBtn');
const generateBtn = document.getElementById('generateBtn');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const includeUppercase = document.getElementById('includeUppercase');
const includeLowercase = document.getElementById('includeLowercase');
const includeNumbers = document.getElementById('includeNumbers');
const includeSymbols = document.getElementById('includeSymbols');
const strengthFill = document.getElementById('strengthFill');
const strengthText = document.getElementById('strengthText');
const notification = document.getElementById('notification');

// 文字セットの定義
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const numbers = '0123456789';
const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// スライダーの値更新
lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

// パスワード生成関数
function generatePassword() {
    let charset = '';
    
    // 選択された文字セットを結合
    if (includeUppercase.checked) charset += uppercase;
    if (includeLowercase.checked) charset += lowercase;
    if (includeNumbers.checked) charset += numbers;
    if (includeSymbols.checked) charset += symbols;
    
    // 少なくとも1つのオプションが選択されているか確認
    if (charset.length === 0) {
        showNotification('少なくとも1つの文字タイプを選択してください', 'error');
        return;
    }
    
    const length = parseInt(lengthSlider.value);
    let password = '';
    
    // ランダムなパスワードを生成
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        password += charset[array[i] % charset.length];
    }
    
    // 選択された文字タイプがすべて含まれているか確認（最低限の保証）
    password = ensureCharacterTypes(password, charset, length);
    
    passwordText.textContent = password;
    updateStrength(password);
}

// 文字タイプが確実に含まれるようにする関数
function ensureCharacterTypes(password, charset, length) {
    const selectedTypes = [];
    if (includeUppercase.checked) selectedTypes.push(uppercase);
    if (includeLowercase.checked) selectedTypes.push(lowercase);
    if (includeNumbers.checked) selectedTypes.push(numbers);
    if (includeSymbols.checked) selectedTypes.push(symbols);
    
    // 各タイプが少なくとも1文字含まれているか確認
    for (const type of selectedTypes) {
        if (!password.split('').some(char => type.includes(char))) {
            // 含まれていない場合は、ランダムな位置に挿入
            const randomIndex = Math.floor(Math.random() * password.length);
            const randomChar = type[Math.floor(Math.random() * type.length)];
            password = password.substring(0, randomIndex) + randomChar + password.substring(randomIndex + 1);
        }
    }
    
    return password;
}

// パスワード強度の計算と表示
function updateStrength(password) {
    let strength = 0;
    let strengthLabel = '';
    let strengthClass = '';
    
    // 長さによる評価
    if (password.length >= 12) strength += 2;
    else if (password.length >= 8) strength += 1;
    
    // 文字タイプによる評価
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    
    const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
    strength += typeCount;
    
    // 強度の判定
    if (strength <= 2) {
        strengthLabel = '弱い';
        strengthClass = 'weak';
    } else if (strength <= 4) {
        strengthLabel = '普通';
        strengthClass = 'medium';
    } else if (strength <= 5) {
        strengthLabel = '強い';
        strengthClass = 'strong';
    } else {
        strengthLabel = '非常に強い';
        strengthClass = 'very-strong';
    }
    
    // UI更新
    strengthFill.className = `strength-fill ${strengthClass}`;
    strengthText.textContent = strengthLabel;
    strengthText.style.color = getStrengthColor(strengthClass);
}

// 強度に応じた色を取得
function getStrengthColor(strengthClass) {
    const colors = {
        'weak': '#ef4444',
        'medium': '#f59e0b',
        'strong': '#10b981',
        'very-strong': '#3b82f6'
    };
    return colors[strengthClass] || '#94a3b8';
}

// コピー機能
copyBtn.addEventListener('click', () => {
    const password = passwordText.textContent;
    
    if (password === 'パスワードがここに表示されます' || !password) {
        showNotification('先にパスワードを生成してください', 'error');
        return;
    }
    
    navigator.clipboard.writeText(password).then(() => {
        showNotification('パスワードをクリップボードにコピーしました！');
    }).catch(() => {
        // フォールバック: 古いブラウザ対応
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('パスワードをクリップボードにコピーしました！');
        } catch (err) {
            showNotification('コピーに失敗しました', 'error');
        }
        document.body.removeChild(textArea);
    });
});

// 通知表示関数
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    if (type === 'error') {
        notification.style.background = '#ef4444';
    } else {
        notification.style.background = '#10b981';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// パスワード生成ボタンのイベント
generateBtn.addEventListener('click', generatePassword);

// 初期パスワード生成
generatePassword();

// Enterキーでパスワード生成
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        generatePassword();
    }
});

// セキュリティ: ページが閉じられる際にパスワードをクリア
window.addEventListener('beforeunload', () => {
    passwordText.textContent = '';
});

// セキュリティ: ページが非表示になったときにパスワードをクリア（オプション）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ページが非表示になったときはクリアしない（ユーザーが別タブに切り替えただけの可能性があるため）
        // 必要に応じて有効化: passwordText.textContent = '';
    }
});
