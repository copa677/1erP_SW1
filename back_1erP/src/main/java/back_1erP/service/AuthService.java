package back_1erP.service;

import back_1erP.dto.AuthRequestDTO;
import back_1erP.dto.TokenResponseDTO;
import back_1erP.dto.UserRegisterDTO;
import back_1erP.model.User;
import back_1erP.repository.UserRepository;
import back_1erP.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public TokenResponseDTO register(UserRegisterDTO request) {
        var user = User.builder()
                .nombres(request.nombres())
                .apellidos(request.apellidos())
                .correo(request.correo())
                .password(passwordEncoder.encode(request.password()))
                .rol(request.rol())
                .createdAt(ZonedDateTime.now(ZoneId.of("America/La_Paz")).toLocalDateTime())
                .activo(true)
                .build();
        
        userRepository.save(user);
        
        var userDetails = userDetailsService.loadUserByUsername(user.getCorreo());
        var jwtToken = jwtService.generateToken(userDetails);
        return new TokenResponseDTO(jwtToken);
    }

    public TokenResponseDTO login(AuthRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.correo(),
                        request.password()
                )
        );
        
        var userDetails = userDetailsService.loadUserByUsername(request.correo());
        var jwtToken = jwtService.generateToken(userDetails);
        return new TokenResponseDTO(jwtToken);
    }
}
