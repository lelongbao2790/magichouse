export type Language = "vi" | "en"

export const translations = {
  // Common
  common: {
    back: { vi: "Trở về", en: "Back" },
    hello: { vi: "Xin chào", en: "Hello" },
    coins: { vi: "Xu", en: "Coins" },
    coinCount: { vi: "Số Xu", en: "Your Coins" },
    start: { vi: "Bắt Đầu Nào!", en: "Let's Start!" },
    next: { vi: "Tiếp theo", en: "Next" },
    close: { vi: "Đóng", en: "Close" },
    ok: { vi: "OK", en: "OK" },
    cancel: { vi: "Hủy", en: "Cancel" },
    save: { vi: "Lưu", en: "Save" },
    delete: { vi: "Xóa", en: "Delete" },
    clearAll: { vi: "Xóa hết", en: "Clear All" },
    collection: { vi: "Bộ sưu tập", en: "Collection" },
  },

  // Welcome Screen
  welcome: {
    title: { vi: "Học vui cùng bé!", en: "Learn & Play!" },
    subtitle: { vi: "Khám phá thế giới tri thức", en: "Discover the world of knowledge" },
    inputPlaceholder: { vi: "Nhập tên của bé...", en: "Enter your name..." },
    chooseTheme: { vi: "Chọn màu sắc yêu thích", en: "Choose your favorite color" },
    greenForest: { vi: "Rừng Xanh", en: "Green Forest" },
    pinkCandy: { vi: "Kẹo Hồng", en: "Pink Candy" },
    ocean: { vi: "Đại Dương", en: "Ocean" },
  },

  // Dashboard
  dashboard: {
    title: { vi: "Trang chủ", en: "Dashboard" },
    preschool: { vi: "Mầm non", en: "Preschool" },
    preschoolDesc: { vi: "Học mà chơi, chơi mà học!", en: "Learn while playing!" },
    grade1: { vi: "Lớp 1", en: "Grade 1" },
    grade1Desc: { vi: "Kiến thức cơ bản cho bé!", en: "Basic knowledge for kids!" },
    grade2: { vi: "Lớp 2", en: "Grade 2" },
    grade2Desc: { vi: "Toán nâng cao cho bé!", en: "Advanced math for kids!" },
    stickerShop: { vi: "Cửa hàng Sticker", en: "Sticker Shop" },
    stickerShopDesc: { vi: "Mua sticker dễ thương bằng xu!", en: "Buy cute stickers with coins!" },
    creativeRoom: { vi: "Phòng sáng tạo", en: "Creative Room" },
    creativeRoomDesc: { vi: "Trang trí nhân vật yêu thích!", en: "Decorate your favorite character!" },
    learningZone: { vi: "Khu vực học tập", en: "Learning Zone" },
    learningZoneDesc: { vi: "Học và nhận xu thưởng!", en: "Learn and earn coins!" },
    startLearning: { vi: "Bắt đầu học", en: "Start Learning" },
  },

  // Categories
  categories: {
    shapes: { vi: "Hình dạng", en: "Shapes" },
    colors: { vi: "Màu sắc", en: "Colors" },
    animals: { vi: "Con vật", en: "Animals" },
    math: { vi: "Toán", en: "Math" },
    vietnamese: { vi: "Tiếng Việt", en: "Vietnamese" },
    english: { vi: "Anh Văn", en: "English" },
    addition: { vi: "Phép Cộng", en: "Addition" },
    subtraction: { vi: "Phép Trừ", en: "Subtraction" },
    timesTable: { vi: "Bảng Nhân", en: "Times Table" },
  },

  // Quiz
  quiz: {
    title: { vi: "Quiz", en: "Quiz" },
    question: { vi: "Câu hỏi", en: "Question" },
    correct: { vi: "Chính xác! Giỏi quá!", en: "Correct! Great job!" },
    incorrect: { vi: "Chưa đúng rồi. Cố gắng lên nhé!", en: "Not quite right. Try again!" },
    nextQuestion: { vi: "Câu tiếp theo", en: "Next Question" },
    viewResults: { vi: "Xem kết quả", en: "View Results" },
    completed: { vi: "Hoàn thành!", en: "Completed!" },
    score: { vi: "Bạn trả lời đúng", en: "You answered correctly" },
    of: { vi: "câu", en: "questions" },
    claimCoins: { vi: "Nhận Xu!", en: "Claim Coins!" },
    earnCoins: { vi: "+Xu", en: "+Coins" },
    loading: { vi: "Đang tải câu hỏi...", en: "Loading questions..." },
    loadError: { vi: "Không tải được câu hỏi.", en: "Couldn't load the questions." },
    retry: { vi: "Thử lại", en: "Try again" },
    noQuestions: { vi: "Chưa có câu hỏi cho phần này.", en: "No questions here yet." },
  },

  // Math quiz titles (questions are generated in code, not stored)
  quizMath: {
    title: { vi: "Quiz Toán học", en: "Math Quiz" },
  },

  // Grade 2 Math
  grade2: {
    title: { vi: "Lớp 2 - Toán nâng cao", en: "Grade 2 - Advanced Math" },
  },

  quizAddition: {
    title: { vi: "Quiz Phép Cộng", en: "Addition Quiz" },
  },

  quizSubtraction: {
    title: { vi: "Quiz Phép Trừ", en: "Subtraction Quiz" },
  },

  quizTimesTable: {
    title: { vi: "Quiz Bảng Nhân", en: "Times Table Quiz" },
  },

  // Sticker Shop
  shop: {
    title: { vi: "Cửa hàng Sticker", en: "Sticker Shop" },
    collection: { vi: "Bộ sưu tập", en: "Collection" },
    goToCreative: { vi: "Đến Phòng sáng tạo", en: "Go to Creative Room" },
    buyNow: { vi: "Mua ngay", en: "Buy Now" },
    owned: { vi: "Đã sở hữu", en: "Owned" },
    needMore: { vi: "Thiếu", en: "Need" },
    coin: { vi: "xu", en: "coins" },
    hats: { vi: "Mũ & Nón", en: "Hats & Caps" },
    glasses: { vi: "Kính mắt", en: "Glasses" },
    bows: { vi: "Nơ & Trang trí", en: "Bows & Decor" },
    toys: { vi: "Đồ chơi", en: "Toys" },
    noStickers: { vi: "Không có sticker nào trong danh mục này.", en: "No stickers in this category." },
  },

  // Creative Room
  creative: {
    title: { vi: "Phòng sáng tạo", en: "Creative Room" },
    yourCollection: { vi: "Bộ sưu tập của bạn", en: "Your Collection" },
    dragHint: { vi: "Kéo thả sticker lên nhân vật để trang trí!", en: "Drag and drop stickers to decorate!" },
    dropHere: { vi: "Thả sticker vào đây!", en: "Drop sticker here!" },
    noStickers: { vi: "Bạn chưa có sticker nào.", en: "You don't have any stickers yet." },
    buyMore: { vi: "Mua thêm sticker", en: "Buy More Stickers" },
    goToShop: { vi: "Đi mua sticker", en: "Go to Shop" },
    selectCharacter: { vi: "Chọn nhân vật", en: "Select Character" },
    resizeHint: { vi: "Chạm vào sticker để thay đổi kích thước", en: "Tap sticker to resize" },
    characters: {
      boy: { vi: "Bé trai", en: "Boy" },
      girl: { vi: "Bé gái", en: "Girl" },
      cat: { vi: "Mèo con", en: "Kitten" },
      dog: { vi: "Chó con", en: "Puppy" },
      bear: { vi: "Gấu con", en: "Bear" },
      bunny: { vi: "Thỏ con", en: "Bunny" },
      panda: { vi: "Gấu trúc", en: "Panda" },
      fox: { vi: "Cáo con", en: "Fox" },
      unicorn: { vi: "Kỳ lân", en: "Unicorn" },
    },
  },

  // Sticker Names
  stickers: {
    cowboyHat: { vi: "Mũ cao bồi", en: "Cowboy Hat" },
    crown: { vi: "Vương miện", en: "Crown" },
    partyHat: { vi: "Mũ tiệc", en: "Party Hat" },
    topHat: { vi: "Mũ chóp", en: "Top Hat" },
    sunglasses: { vi: "Kính râm", en: "Sunglasses" },
    glasses: { vi: "Kính cận", en: "Glasses" },
    starGlasses: { vi: "Kính ngôi sao", en: "Star Glasses" },
    redBow: { vi: "Nơ đỏ", en: "Red Bow" },
    ribbon: { vi: "Ruy băng", en: "Ribbon" },
    flower: { vi: "Bông hoa", en: "Flower" },
    balloon: { vi: "Bóng bay", en: "Balloon" },
    toy: { vi: "Đồ chơi", en: "Toy" },
    ball: { vi: "Quả bóng", en: "Ball" },
    car: { vi: "Xe hơi", en: "Car" },
    rocket: { vi: "Tên lửa", en: "Rocket" },
    star: { vi: "Ngôi sao", en: "Star" },
  },

  // Theme names
  themes: {
    greenForest: { vi: "Rừng Xanh", en: "Green Forest" },
    pinkCandy: { vi: "Kẹo Hồng", en: "Pink Candy" },
    ocean: { vi: "Đại Dương", en: "Ocean" },
  },

  // Language
  language: {
    switchTo: { vi: "Chuyển sang", en: "Switch to" },
    vietnamese: { vi: "Tiếng Việt", en: "Vietnamese" },
    english: { vi: "Tiếng Anh", en: "English" },
  },
} as const

export type TranslationKey = keyof typeof translations
