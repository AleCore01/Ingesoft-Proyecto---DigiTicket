package com.digiticket.service.user;

import com.digiticket.domain.user.Client;
import com.digiticket.dto.user.AdminClientDTO;
import com.digiticket.dto.user.UpdateUserProfileRequest;
import com.digiticket.dto.user.UserProfileDTO;
import com.digiticket.domain.loyalty.LoyaltyPointStatus;
import com.digiticket.dto.user.AdminClientDTO;
import java.util.List;

public interface ClientService {
    Client save(Client client);
    UserProfileDTO getProfileByUserId(Integer userId);
    UserProfileDTO updateCurrentProfileByUserId(UpdateUserProfileRequest request, Integer userId);
    List<AdminClientDTO> listActiveClients();
    void deactivateClient(Integer clientId);
    List<AdminClientDTO> searchActiveClientsByName(String name);
    List<AdminClientDTO> listClientsByPointsStatus(LoyaltyPointStatus status);

    List<AdminClientDTO> searchClientsByPointsStatusAndName(LoyaltyPointStatus status, String name);
    List<AdminClientDTO> listClientsWithPointsExpiringInNextDays(int days);
}
