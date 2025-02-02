#ifndef RING_BUFFER_H
#define RING_BUFFER_H

#include <Arduino.h> // or <cstring> if needed


SemaphoreHandle_t rb_mutex;

typedef struct {
    uint8_t* buffer;
    size_t size;
    size_t readIndex;
    size_t writeIndex;
} ring_buffer_t;

static inline void ring_buffer_init(ring_buffer_t* rb, uint8_t* buf, size_t size)
{
    rb->buffer = buf;
    rb->size = size;
    rb->readIndex = 0;
    rb->writeIndex = 0;
}

static inline size_t ring_buffer_available(const ring_buffer_t* rb)
{
    if (rb->writeIndex >= rb->readIndex) {
        return rb->writeIndex - rb->readIndex;
    } else {
        return (rb->size - rb->readIndex) + rb->writeIndex;
    }
}

static inline size_t ring_buffer_free_space(const ring_buffer_t* rb)
{
    return rb->size - ring_buffer_available(rb) - 1; 
}

static inline size_t ring_buffer_write(ring_buffer_t* rb, const uint8_t* data, size_t length)
{
    size_t freeSpace = ring_buffer_free_space(rb);
    if (length > freeSpace) {
        length = freeSpace;
    }

    size_t toEnd = rb->size - rb->writeIndex;
    if (length <= toEnd) {
        memcpy(rb->buffer + rb->writeIndex, data, length);
        rb->writeIndex += length;
        if (rb->writeIndex == rb->size) {
            rb->writeIndex = 0;
        }
    } else {
        memcpy(rb->buffer + rb->writeIndex, data, toEnd);
        size_t remaining = length - toEnd;
        memcpy(rb->buffer, data + toEnd, remaining);
        rb->writeIndex = remaining;
    }

    return length;
}

static inline size_t ring_buffer_read(ring_buffer_t* rb, uint8_t* dest, size_t length)
{
    size_t availableBytes = ring_buffer_available(rb);
    if (length > availableBytes) {
        length = availableBytes;
    }

    size_t toEnd = rb->size - rb->readIndex;
    if (length <= toEnd) {
        memcpy(dest, rb->buffer + rb->readIndex, length);
        rb->readIndex += length;
        if (rb->readIndex == rb->size) {
            rb->readIndex = 0;
        }
    } else {
        memcpy(dest, rb->buffer + rb->readIndex, toEnd);
        size_t remaining = length - toEnd;
        memcpy(dest + toEnd, rb->buffer, remaining);
        rb->readIndex = remaining;
    }

    return length;
}

// ring_buffer_write protected:
size_t ring_buffer_write_safe(ring_buffer_t* rb, const uint8_t* data, size_t length) {
  xSemaphoreTake(rb_mutex, portMAX_DELAY);
  size_t written = ring_buffer_write(rb, data, length);
  xSemaphoreGive(rb_mutex);
  return written;
}

// ring_buffer_read protected:
size_t ring_buffer_read_safe(ring_buffer_t* rb, uint8_t* dest, size_t length) {
  xSemaphoreTake(rb_mutex, portMAX_DELAY);
  size_t read = ring_buffer_read(rb, dest, length);
  xSemaphoreGive(rb_mutex);
  return read;
}

size_t ring_buffer_write_blocking(ring_buffer_t* rb, const uint8_t* data, size_t length) {
    // Wait until there's enough space
    while (ring_buffer_free_space(rb) < length) {
        vTaskDelay(1); // or yield
    }
    // then do the full write
    return ring_buffer_write(rb, data, length);
}

#endif
