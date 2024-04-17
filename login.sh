#!/bin/bash -eu

# ログイン先を切り替えるスクリプト
# ref: https://qiita.com/naoyeah/items/0db5fc82561020f2768e

RUNNING_MODE=$1
cd $(dirname $0)

# login先を明示的に設定
if [[ $RUNNING_MODE = dev ]]; then
    # login先を開発環境に変更
    SCRIPT_ID=$SCRIPT_ID_DEV
    # 設定を反映
    cp ./.env/clasp_dev.json .clasp.json
elif [[ $RUNNING_MODE = prod ]]; then
    # login先を本番環境に変更
    SCRIPT_ID=$SCRIPT_ID_PROD
    # 設定を反映
    cp ./.env/clasp_prod.json .clasp.json
else
    echo 'usage: ./login.sh <dev|prod>'
    exit 1
fi

# 仕様変更でclasp login --no-localhostが使えなくなった
echo '出力されたURLにブラウザでアクセスして、フローに従って許可してください。最後に遷移するURL（localhost:***）をコピーしてINPUT_URL_STR: にペースト、エンターしてください。'

# バックグランドでlogin処理を継続させて次の処理を行う
{
    clasp login
} &

# スリープで表示順を調整する
sleep 3
#プロンプトをechoを使って表示、
echo -n INPUT_URL_STR:
#入力を受付、その入力を「str」に代入
read str
#結果を表示
curl $str

# バックグラウンドのログイン処理が完了したら次の処理をする
wait
echo 'login to' $RUNNING_MODE
# 開発環境に戻す
cp ./.env/clasp_dev.json .clasp.json
echo 'scriptId changed to dev'
