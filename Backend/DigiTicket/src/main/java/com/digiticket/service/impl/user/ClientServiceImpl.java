package com.digiticket.service.impl.user;

import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import com.digiticket.domain.order.Order;
import com.digiticket.domain.user.Client;
import com.digiticket.domain.user.DocumentType;
import com.digiticket.domain.user.User;
import com.digiticket.domain.user.UserStatus;
import com.digiticket.dto.loyalty.PointsBalanceDTO;
import com.digiticket.dto.user.AdminClientDTO;
import com.digiticket.dto.user.UpdateUserProfileRequest;
import com.digiticket.dto.user.UserProfileDTO;
import com.digiticket.repository.loyalty.LoyaltyPointRepository;
import com.digiticket.repository.order.OrderRepository;
import com.digiticket.repository.user.ClientRepository;
import com.digiticket.repository.user.UserRepository;
import com.digiticket.service.loyalty.LoyaltyService;
import com.digiticket.service.user.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final LoyaltyService loyaltyService;
    private final LoyaltyPointRepository loyaltyPointRepository;

    @Autowired
    public ClientServiceImpl(ClientRepository clientRepository,
                             UserRepository userRepository,
                             OrderRepository orderRepository,
                             LoyaltyService loyaltyService,
                             LoyaltyPointRepository loyaltyPointRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.loyaltyService = loyaltyService;
        this.loyaltyPointRepository = loyaltyPointRepository;
    }

    @Override
    public Client save(Client client) {
        return clientRepository.save(client);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDTO getProfileByUserId(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Client client = clientRepository.findByUserId(userId)
                .orElse(null);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getUserId() != null && o.getUserId().equals(userId))
                .toList();

        int totalPurchases = orders.size();
        double totalSpent = orders.stream()
                .filter(o -> o.getTotalPaid() != null)
                .map(Order::getTotalPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .doubleValue();

        Integer loyaltyPoints = 0;
        if (client != null) {
            PointsBalanceDTO balance = loyaltyService.getBalance(client.getId());
            loyaltyPoints = balance.getTotalPoints();
        }

        return UserProfileDTO.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(client != null ? client.getPhoneNumber() : null)
                .documentType(user.getDocumentType() != null ? user.getDocumentType().name() : null)
                .documentNumber(user.getDocumentNumber())
                .birthDate(client != null ? client.getBirthDate() : null)
                .gender(null)
                .loyaltyPoints(loyaltyPoints)
                .totalPurchases(totalPurchases)
                .totalSpent(totalSpent)
                .memberSince(user.getCreatedAt())
                .build();
    }

    @Override
    public UserProfileDTO updateCurrentProfileByUserId(UpdateUserProfileRequest request, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Client client = clientRepository.findByUserId(userId)
                .orElse(null);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getDocumentNumber() != null) {
            user.setDocumentNumber(request.getDocumentNumber());
        }
        if (request.getDocumentType() != null) {
            if (user.getDocumentType() == null ||
                    !user.getDocumentType().name().equals(request.getDocumentType())) {
                user.setDocumentType(DocumentType.valueOf(request.getDocumentType()));
            }
        }
        assert client != null;
        if (request.getPhone() != null) {
            client.setPhoneNumber(request.getPhone());
        }
        if (request.getBirthDate() != null) {
            client.setBirthDate(request.getBirthDate());
        }

        client.setUser(user);
        userRepository.save(user);
        clientRepository.save(client);
        return getProfileByUserId(userId);
    }

    @Override
    public List<AdminClientDTO> listActiveClients() {
        return clientRepository.findAll().stream()
                .filter(client -> client.getUser() != null
                        && client.getUser().getStatus() == UserStatus.ACTIVE)
                .map(this::toAdminClientDTO)
                .toList();
    }

    @Override
    public void deactivateClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        User user = client.getUser();
        if (user == null) {
            throw new RuntimeException("Client has no associated user");
        }

        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
    }

    @Override
    public List<AdminClientDTO> searchActiveClientsByName(String name) {
        List<Client> clients = clientRepository.searchByNameAndStatus(
                name,
                UserStatus.ACTIVE
        );

        return clients.stream()
                .map(this::toAdminClientDTO)
                .toList();
    }

    // ================== NUEVOS MÉTODOS PARA FILTRAR POR STATUS DE PUNTOS ==================

    @Override
    @Transactional(readOnly = true)
    public List<AdminClientDTO> listClientsByPointsStatus(LoyaltyPointStatus status) {
        // ids de clientes que tienen al menos un registro de puntos con ese status
        List<Integer> clientIds = loyaltyPointRepository.findDistinctClientIdsByStatus(status);
        if (clientIds.isEmpty()) {
            return List.of();
        }

        return clientRepository.findAll().stream()
                .filter(client -> client.getUser() != null
                        && client.getUser().getStatus() == UserStatus.ACTIVE)
                .filter(client -> clientIds.contains(client.getId()))
                .map(this::toAdminClientDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminClientDTO> searchClientsByPointsStatusAndName(LoyaltyPointStatus status, String name) {
        List<Integer> clientIds = loyaltyPointRepository.findDistinctClientIdsByStatus(status);
        if (clientIds.isEmpty()) {
            return List.of();
        }

        // primero filtro por nombre + ACTIVE (query ya existente),
        // luego me quedo solo con los que tienen puntos en ese status.
        List<Client> clients = clientRepository.searchByNameAndStatus(name, UserStatus.ACTIVE).stream()
                .filter(client -> clientIds.contains(client.getId()))
                .toList();

        return clients.stream()
                .map(this::toAdminClientDTO)
                .toList();
    }

    // ================== HELPER COMÚN PARA ARMAR AdminClientDTO ==================

    private AdminClientDTO toAdminClientDTO(Client client) {
        User user = client.getUser();

        // balance de puntos
        PointsBalanceDTO balance = loyaltyService.getBalance(client.getId());
        int totalPoints = balance.getTotalPoints();

        LocalDate pointsExpiryDate = null;
        if (balance.getExpiringSoon() != null && !balance.getExpiringSoon().isEmpty()) {
            pointsExpiryDate = balance.getExpiringSoon()
                    .get(0)
                    .getExpiresAt()
                    .toLocalDate();
        }

        return AdminClientDTO.builder()
                .id(client.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .loyaltyPoints(totalPoints)
                .pointsExpiryDate(pointsExpiryDate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminClientDTO> listClientsWithPointsExpiringInNextDays(int days) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime limit = now.plusDays(days);

        return clientRepository.findAll().stream()
                .filter(client -> client.getUser() != null
                        && client.getUser().getStatus() == UserStatus.ACTIVE)
                .filter(client -> {
                    // usamos directly los puntos del cliente
                    var points = loyaltyPointRepository.findByClientIdOrderByCreatedAtDesc(client.getId());
                    return points.stream().anyMatch(p ->
                            p.getStatus() == LoyaltyPointStatus.ACTIVE
                                    && p.getExpiresAt() != null
                                    && p.getExpiresAt().isAfter(now)
                                    && !p.getExpiresAt().isAfter(limit)
                    );
                })
                .map(this::toAdminClientDTO)
                .toList();
    }

}
