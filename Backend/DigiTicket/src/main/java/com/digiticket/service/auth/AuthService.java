package com.digiticket.service.auth;

import com.digiticket.dto.auth.ClientRegisterRequest;
import com.digiticket.dto.auth.ClientRegisterResponse;
import com.digiticket.dto.auth.LoginRequest;
import com.digiticket.dto.auth.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    ClientRegisterResponse registerClient(ClientRegisterRequest request);
}
