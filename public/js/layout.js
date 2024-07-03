// Initialize the nav bar based on the size of the screen
if ($(window).width() < 1000) {
    $(".nav-btn").addClass("not-shown");
    $(".nav-container").css("width", "90%")
    $(".brand-logo").css("left", "44%")
}

if ($(window).width() >= 1000) {
    $(".bi-list").addClass("not-shown")
}


// This will execute whenever the window is resized
$(window).on("resize", function() {
    if ($(window).width() < 1000) {
        $(".nav-btn").addClass("not-shown");
        $(".nav-container").css("width", "90%")
        $(".bi-list").removeClass("not-shown")
        $(".brand-logo").css("left", "44%")
    }
    
    if ($(window).width() >= 1000) {
        $(".bi-list").addClass("not-shown")
        $(".nav-btn").removeClass("not-shown");
        $(".nav-container").css("width", "80%")
        $(".brand-logo").css("left", "0%")
    }
  });


// Pagination
if (typeof currPageNum !== 'undefined') {
    $(".pagination .active").removeClass("active").addClass("waves-effect");
    
    $(".pagination .active").removeClass("active");
}

// Scroll effect for the navigation bar
$(window).on('scroll', function() {
    if ($(this).scrollTop() <= 90) {
        $('nav').addClass('scroll-top');
    } else {
        $('nav').removeClass('scroll-top');
    }
})

$("recom-title").on("load", function(){
    ("#recom-title").css("animation", "movingTopToBottom 0.4s");
});
