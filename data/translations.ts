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
    claimCoins: { vi: "Nhận 10 Xu!", en: "Claim 10 Coins!" },
    earnCoins: { vi: "+10 Xu", en: "+10 Coins" },
  },

  // Quiz Questions - Shapes
  quizShapes: {
    title: { vi: "Quiz Hình dạng", en: "Shapes Quiz" },
    q1: { 
      vi: "Đây là hình gì? (Có 4 cạnh bằng nhau và 4 góc vuông)", 
      en: "What shape is this? (Has 4 equal sides and 4 right angles)" 
    },
    q1o1: { vi: "Hình tròn", en: "Circle" },
    q1o2: { vi: "Hình vuông", en: "Square" },
    q1o3: { vi: "Hình tam giác", en: "Triangle" },
    q2: { vi: "Hình nào có 3 cạnh?", en: "Which shape has 3 sides?" },
    q2o1: { vi: "Hình tam giác", en: "Triangle" },
    q2o2: { vi: "Hình chữ nhật", en: "Rectangle" },
    q2o3: { vi: "Hình tròn", en: "Circle" },
    q3: { vi: "Bánh xe có hình gì?", en: "What shape is a wheel?" },
    q3o1: { vi: "Hình vuông", en: "Square" },
    q3o2: { vi: "Hình tròn", en: "Circle" },
    q3o3: { vi: "Hình tam giác", en: "Triangle" },
  },

  // Quiz Questions - Colors
  quizColors: {
    title: { vi: "Quiz Màu sắc", en: "Colors Quiz" },
    q1: { vi: "Lá cây có màu gì?", en: "What color are leaves?" },
    q1o1: { vi: "Màu đỏ", en: "Red" },
    q1o2: { vi: "Màu xanh lá", en: "Green" },
    q1o3: { vi: "Màu vàng", en: "Yellow" },
    q2: { vi: "Mặt trời có màu gì?", en: "What color is the sun?" },
    q2o1: { vi: "Màu xanh", en: "Blue" },
    q2o2: { vi: "Màu tím", en: "Purple" },
    q2o3: { vi: "Màu vàng", en: "Yellow" },
    q3: { vi: "Quả táo chín thường có màu gì?", en: "What color is a ripe apple?" },
    q3o1: { vi: "Màu đỏ", en: "Red" },
    q3o2: { vi: "Màu xanh", en: "Blue" },
    q3o3: { vi: "Màu trắng", en: "White" },
  },

  // Quiz Questions - Animals
  quizAnimals: {
    title: { vi: "Quiz Con vật", en: "Animals Quiz" },
    q1: { vi: "Con vật nào kêu 'Gâu gâu'?", en: "Which animal says 'Woof woof'?" },
    q1o1: { vi: "Con mèo", en: "Cat" },
    q1o2: { vi: "Con chó", en: "Dog" },
    q1o3: { vi: "Con gà", en: "Chicken" },
    q2: { vi: "Con vật nào sống dưới nước?", en: "Which animal lives in water?" },
    q2o1: { vi: "Con chim", en: "Bird" },
    q2o2: { vi: "Con cá", en: "Fish" },
    q2o3: { vi: "Con thỏ", en: "Rabbit" },
    q3: { vi: "Con vật nào có vòi dài?", en: "Which animal has a long trunk?" },
    q3o1: { vi: "Con hươu", en: "Deer" },
    q3o2: { vi: "Con voi", en: "Elephant" },
    q3o3: { vi: "Con sư tử", en: "Lion" },
  },

    // Quiz Questions - Math
  quizMath: {
    title: { vi: "Quiz Toán học", en: "Math Quiz" },
  },

  // Quiz Questions - Vietnamese
  quizVietnamese: {
    title: { vi: "Quiz Tiếng Việt", en: "Vietnamese Quiz" },
    q1: { vi: "Chữ cái nào đứng đầu bảng chữ cái?", en: "Which letter comes first in the alphabet?" },
    q2: { vi: "'Mẹ' bắt đầu bằng chữ gì?", en: "What letter does 'Me' (Mom) start with?" },
    q3: { vi: "Từ nào chỉ người sinh ra mình?", en: "Which word means the person who gave birth to you?" },
    q3o1: { vi: "Bạn", en: "Friend" },
    q3o2: { vi: "Thầy", en: "Teacher" },
    q3o3: { vi: "Mẹ", en: "Mom" },
  },

    // Quiz Questions - English
  quizEnglish: {
    title: { vi: "Quiz Anh Văn", en: "English Quiz" },
    q1: { vi: "'Apple' nghĩa là gì?", en: "What does 'Apple' mean?" },
    q1o1: { vi: "Quả cam", en: "Orange" },
    q1o2: { vi: "Quả táo", en: "Apple" },
    q1o3: { vi: "Quả chuối", en: "Banana" },
    q2: { vi: "'Dog' nghĩa là gì?", en: "What does 'Dog' mean?" },
    q2o1: { vi: "Con mèo", en: "Cat" },
    q2o2: { vi: "Con chó", en: "Dog" },
    q2o3: { vi: "Con chim", en: "Bird" },
    q3: { vi: "'Red' là màu gì?", en: "What color is 'Red'?" },
    q3o1: { vi: "Màu xanh", en: "Blue" },
    q3o2: { vi: "Màu vàng", en: "Yellow" },
    q3o3: { vi: "Màu đỏ", en: "Red" },
    q4: { vi: "'Cat' nghĩa là gì?", en: "What does 'Cat' mean?" },
    q4o1: { vi: "Con chó", en: "Dog" },
    q4o2: { vi: "Con mèo", en: "Cat" },
    q4o3: { vi: "Con thỏ", en: "Rabbit" },
    q5: { vi: "'Sun' nghĩa là gì?", en: "What does 'Sun' mean?" },
    q5o1: { vi: "Mặt trăng", en: "Moon" },
    q5o2: { vi: "Ngôi sao", en: "Star" },
    q5o3: { vi: "Mặt trời", en: "Sun" },
    q6: { vi: "'Blue' là màu gì?", en: "What color is 'Blue'?" },
    q6o1: { vi: "Màu xanh dương", en: "Blue" },
    q6o2: { vi: "Màu xanh lá", en: "Green" },
    q6o3: { vi: "Màu tím", en: "Purple" },
    q7: { vi: "'Book' nghĩa là gì?", en: "What does 'Book' mean?" },
    q7o1: { vi: "Bút chì", en: "Pencil" },
    q7o2: { vi: "Quyển sách", en: "Book" },
    q7o3: { vi: "Cái bàn", en: "Table" },
    q8: { vi: "'Water' nghĩa là gì?", en: "What does 'Water' mean?" },
    q8o1: { vi: "Lửa", en: "Fire" },
    q8o2: { vi: "Đất", en: "Earth" },
    q8o3: { vi: "Nước", en: "Water" },
    q9: { vi: "'House' nghĩa là gì?", en: "What does 'House' mean?" },
    q9o1: { vi: "Ngôi nhà", en: "House" },
    q9o2: { vi: "Xe hơi", en: "Car" },
    q9o3: { vi: "Cái cây", en: "Tree" },
    q10: { vi: "'Happy' nghĩa là gì?", en: "What does 'Happy' mean?" },
    q10o1: { vi: "Buồn", en: "Sad" },
    q10o2: { vi: "Vui vẻ", en: "Happy" },
    q10o3: { vi: "Tức giận", en: "Angry" },
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
