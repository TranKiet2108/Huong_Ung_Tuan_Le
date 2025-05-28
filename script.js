document.addEventListener('DOMContentLoaded', () => {
  const imageUpload = document.getElementById('imageUpload');
  const previewCanvas = document.getElementById('previewCanvas');
  const ctx = previewCanvas.getContext('2d');
  const downloadButton = document.getElementById('downloadButton');
  const imageSizeSlider = document.getElementById('imageSize');
  const imageSizeValue = document.getElementById('imageSizeValue');

  let userImage = null;
  let selectedFrame = null;
  let imageX = 0, imageY = 0;
  let imageScale = 1;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;

  function setInitialCanvasSize() {
    previewCanvas.width = 500;
    previewCanvas.height = 350;
    imageX = previewCanvas.width / 2;
    imageY = previewCanvas.height / 2;
  }

  function setCanvasSizeBasedOnFrame() {
    if (selectedFrame && selectedFrame.image) {
      const aspectRatio = selectedFrame.image.naturalWidth / selectedFrame.image.naturalHeight;
      previewCanvas.width = 500;
      previewCanvas.height = previewCanvas.width / aspectRatio;
    } else {
      setInitialCanvasSize();
    }
    imageX = previewCanvas.width / 2;
    imageY = previewCanvas.height / 2;
  }

  function drawCanvas() {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (userImage) {
      const scaledWidth = userImage.naturalWidth * imageScale;
      const scaledHeight = userImage.naturalHeight * imageScale;
      ctx.drawImage(
        userImage,
        imageX - scaledWidth / 2,
        imageY - scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
    } else {
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx.fillStyle = "#777";
      ctx.textAlign = "center";
      ctx.font = "16px Arial";
      ctx.fillText("Tải ảnh của bạn lên", previewCanvas.width / 2, previewCanvas.height / 2);
    }

    if (selectedFrame && selectedFrame.image) {
      ctx.drawImage(selectedFrame.image, 0, 0, previewCanvas.width, previewCanvas.height);
    }
  }

  // Tự động tải khung mặc định
  const defaultFrame = {
    id: 'default',
    name: 'Khung mặc định',
    src: 'frames/default-frame.png'
  };

  const frameImage = new Image();
  frameImage.onload = () => {
    selectedFrame = { ...defaultFrame, image: frameImage };
    setCanvasSizeBasedOnFrame();
    drawCanvas();
  };
  frameImage.onerror = () => {
    console.error("Không thể tải khung viền mặc định.");
    selectedFrame = null;
    setInitialCanvasSize();
    drawCanvas();
  };
  frameImage.src = defaultFrame.src;

  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      userImage = new Image();
      userImage.onload = () => {
        setCanvasSizeBasedOnFrame();
        imageX = previewCanvas.width / 2;
        imageY = previewCanvas.height / 2;
        imageScale = 1;
        imageSizeSlider.value = 100;
        imageSizeValue.textContent = "100%";
        drawCanvas();
        downloadButton.disabled = false;
      };
      userImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  imageSizeSlider.addEventListener('input', (e) => {
    if (!userImage) return;
    imageScale = parseFloat(e.target.value) / 100;
    imageSizeValue.textContent = `${e.target.value}%`;
    drawCanvas();
  });

  // Chuột - kéo ảnh
  previewCanvas.addEventListener('mousedown', (e) => {
    if (!userImage) return;
    const rect = previewCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const w = userImage.naturalWidth * imageScale;
    const h = userImage.naturalHeight * imageScale;

    if (
      mouseX >= imageX - w / 2 &&
      mouseX <= imageX + w / 2 &&
      mouseY >= imageY - h / 2 &&
      mouseY <= imageY + h / 2
    ) {
      isDragging = true;
      dragStartX = mouseX - imageX;
      dragStartY = mouseY - imageY;
      previewCanvas.style.cursor = 'grabbing';
    }
  });

  previewCanvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = previewCanvas.getBoundingClientRect();
      imageX = e.clientX - rect.left - dragStartX;
      imageY = e.clientY - rect.top - dragStartY;
      drawCanvas();
    }
  });

  ['mouseup', 'mouseleave'].forEach(evt =>
    previewCanvas.addEventListener(evt, () => {
      isDragging = false;
      previewCanvas.style.cursor = userImage ? 'grab' : 'default';
    })
  );

  previewCanvas.addEventListener('mouseenter', () => {
    previewCanvas.style.cursor = userImage ? 'grab' : 'default';
  });

  // Cảm ứng - kéo ảnh
  previewCanvas.addEventListener('touchstart', (e) => {
    if (!userImage || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = previewCanvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    const scaledWidth = userImage.naturalWidth * imageScale;
    const scaledHeight = userImage.naturalHeight * imageScale;

    const imgLeft = imageX - scaledWidth / 2;
    const imgRight = imageX + scaledWidth / 2;
    const imgTop = imageY - scaledHeight / 2;
    const imgBottom = imageY + scaledHeight / 2;

    if (touchX >= imgLeft && touchX <= imgRight && touchY >= imgTop && touchY <= imgBottom) {
      isDragging = true;
      dragStartX = touchX - imageX;
      dragStartY = touchY - imageY;
    }
  });

  previewCanvas.addEventListener('touchmove', (e) => {
    if (!isDragging || !userImage || e.touches.length !== 1) return;

    e.preventDefault(); // ⭐ Ngăn cuộn trang khi kéo ảnh

    const touch = e.touches[0];
    const rect = previewCanvas.getBoundingClientRect();
    const moveX = touch.clientX - rect.left;
    const moveY = touch.clientY - rect.top;

    imageX = moveX - dragStartX;
    imageY = moveY - dragStartY;
    drawCanvas();
  }, { passive: false });

  ['touchend', 'touchcancel'].forEach(evt =>
    previewCanvas.addEventListener(evt, () => {
      isDragging = false;
    })
  );

  downloadButton.addEventListener('click', () => {
    if (!userImage) {
      alert("Vui lòng tải ảnh của bạn để ghép với khung!");
      return;
    }

    const outputW = selectedFrame?.image?.naturalWidth || userImage.naturalWidth;
    const outputH = selectedFrame?.image?.naturalHeight || userImage.naturalHeight;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = outputW;
    finalCanvas.height = outputH;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';

    const scaleX = outputW / previewCanvas.width;
    const scaleY = outputH / previewCanvas.height;
    const drawW = userImage.naturalWidth * imageScale * scaleX;
    const drawH = userImage.naturalHeight * imageScale * scaleY;
    const centerX = (imageX / previewCanvas.width) * outputW;
    const centerY = (imageY / previewCanvas.height) * outputH;

    finalCtx.drawImage(userImage, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);

    if (selectedFrame && selectedFrame.image) {
      finalCtx.drawImage(selectedFrame.image, 0, 0, outputW, outputH);
    }

    const link = document.createElement('a');
    link.href = finalCanvas.toDataURL('image/png', 1.0);
    link.download = 'anh_da_ghep_khung.png';
    link.click();
  });
});
