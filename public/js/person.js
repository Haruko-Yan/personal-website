// Generate tags
$('.chips').chips();

$('.oper-item .delete').on("click", function(){
    if (confirm("Are you sure to delete?")) {
        location.href = "/manage/editList/delete/" + $(this).attr("id");
    }
})

// When tick or untick the checkbox of recommendation, submit the change to backend
$('.oper-item form #recommend').on("change", function(){
    $(this).parents("form").trigger("submit");
})

// Add the markdown with path for the uploaded images to the text area
$('.form-control.uploadedImages').on("change", function(){
    let oldValue = $('.form-control.text').val();
    const fileList = $(this).prop("files");
    for (let i = 0; i < fileList.length; i++) {
        let path = "\n\n" + "![title](<http://image.ziqingyan.tech/uploadedImages/" + $('.form-control.author').val() + "/" + $('.form-control.title').val() + "/" + fileList[i].name + ">)";
        $('.form-control.text').val(oldValue + path);
        oldValue = oldValue + path;
    }
})
