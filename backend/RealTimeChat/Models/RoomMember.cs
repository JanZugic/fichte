using System;
using System.Collections.Generic;

namespace RealTimeChat.Models;

public partial class RoomMember
{
    public int RoomId { get; set; }

    public int UserId { get; set; }

    public DateTime? JoinedAt { get; set; }

    public virtual Room Room { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
