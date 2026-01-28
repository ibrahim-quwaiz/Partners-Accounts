#!/bin/bash
# سكريبت لتنظيف العمليات المعلقة والمنافذ المشغولة

echo "🧹 تنظيف العمليات والمنافذ..."

# تنظيف المنفذ 3000 (Backend)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "  ⚠️  إيقاف العملية على المنفذ 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# تنظيف المنفذ 5000 (Frontend)
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "  ⚠️  إيقاف العملية على المنفذ 5000..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# تنظيف عمليات Node.js المعلقة
echo "  🔍 البحث عن عمليات Node.js المعلقة..."
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "vite dev" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

sleep 1

# التحقق من النتيجة
if ! lsof -ti:3000 > /dev/null 2>&1 && ! lsof -ti:5000 > /dev/null 2>&1; then
    echo "  ✅ تم تنظيف جميع المنافذ والعمليات بنجاح"
else
    echo "  ⚠️  لا يزال هناك عمليات نشطة"
    lsof -ti:3000,5000 2>/dev/null | xargs ps -p 2>/dev/null || true
fi

echo ""
