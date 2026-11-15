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

    // 選択された文字タイプをすべて含むランダムなパスワードを生成
    const password = ensureCharacterTypes(charset, length);
    
    passwordText.textContent = password;
    // 表示は省略される場合があるので、全文はツールチップで参照できるようにする
    passwordText.title = password;
    updateStrength(password);
}

// 暗号論的に安全な乱数で 0 以上 max 未満の整数を返す
// （棄却サンプリングで剰余による偏りを防ぐ）
function secureRandomInt(max) {
    const range = 0x100000000; // 2^32
    const limit = range - (range % max);
    const buf = new Uint32Array(1);
    do {
        crypto.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
}

// 選択された文字タイプがすべて含まれるパスワードを生成する関数
// 各タイプから1文字ずつ選び、残りを charset 全体から埋めてからシャッフルする
function ensureCharacterTypes(charset, length) {
    const selectedTypes = [];
    if (includeUppercase.checked) selectedTypes.push(uppercase);
    if (includeLowercase.checked) selectedTypes.push(lowercase);
    if (includeNumbers.checked) selectedTypes.push(numbers);
    if (includeSymbols.checked) selectedTypes.push(symbols);

    // 各タイプから1文字ずつ（長さの最小値4 ≥ タイプ数4 なので必ず収まる）
    const chars = selectedTypes.map(type => type[secureRandomInt(type.length)]);

    // 残りを charset 全体から埋める
    while (chars.length < length) {
        chars.push(charset[secureRandomInt(charset.length)]);
    }

    // Fisher-Yates シャッフル（必須文字の位置が固定されないように）
    for (let i = chars.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
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
    passwordText.title = '';
});

// セキュリティ: ページが非表示になったときにパスワードをクリア（オプション）
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // ページが非表示になったときはクリアしない（ユーザーが別タブに切り替えただけの可能性があるため）
        // 必要に応じて有効化: passwordText.textContent = '';
    }
});
