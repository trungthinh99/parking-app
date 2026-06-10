#!/bin/bash
set -e

DESKTOP="/c/Users/TIN HOC NT/Desktop"
D_DRIVE="/d"

# 1. Clone repo về Desktop
echo "=== Cloning parking-research ==="
cd "$DESKTOP"
rm -rf parking-research
git clone https://github.com/Robcho-jake/parking-research.git

# 2. Copy parking-mobile vào ổ D
echo "=== Copying parking-mobile to D:/ ==="
cp -r "$DESKTOP/parking-research/parking-mobile" "$D_DRIVE/parking-mobile"

# 3. Kiểm tra các folder mb-* trong ổ D và đổi tên
echo "=== Checking for existing mb-* folders ==="
MAX_NUM=0
for dir in "$D_DRIVE"/mb-*/; do
    if [ -d "$dir" ]; then
        basename=$(basename "$dir")
        num="${basename#mb-}"
        if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -gt "$MAX_NUM" ]; then
            MAX_NUM=$num
        fi
    fi
done

NEXT_NUM=$((MAX_NUM + 1))
NEW_NAME="mb-$NEXT_NUM"

echo "=== Renaming parking-mobile -> $NEW_NAME ==="
mv "$D_DRIVE/parking-mobile" "$D_DRIVE/$NEW_NAME"

# 4. Copy build-android.sh từ ổ D vào thư mục mb vừa đổi tên (scripts/)
echo "=== Copying build-android.sh into $NEW_NAME/scripts/ ==="
mkdir -p "$D_DRIVE/$NEW_NAME/scripts"
cp "$D_DRIVE/build-android.sh" "$D_DRIVE/$NEW_NAME/scripts/build-android.sh"

# 5. Vào thư mục mb và chạy build
echo "=== Running build-android.sh ==="
cd "$D_DRIVE/$NEW_NAME"
bash scripts/build-android.sh

echo "=== Done! ==="
