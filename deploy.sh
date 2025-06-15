#!/bin/bash
set -e

# .dev.vars ファイルが存在しない場合はエラーを返す
if [[ ! -f .dev.vars ]]; then
    echo "File .dev.vars not found!"
    exit 1
fi

# .dev.vars ファイルを読み込む
while IFS='=' read -r name value
do
    # valueの前後のクオートを削除
    value=$(echo $value | sed -e 's/^"//' -e 's/"$//')
    echo "Setting $name" #$value
    # wrangler secret put コマンドを実行する
    echo $value | npx wrangler secret put "$name"
done < .dev.vars

npx wrangler secret list

npm run deploy
