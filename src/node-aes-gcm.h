#ifndef AES_GCM_H_
#define AES_GCM_H_

#include <nan.h>

namespace gcm {

    NAN_METHOD(Encrypt);
    NAN_METHOD(Decrypt);

}

#endif