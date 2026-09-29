import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button, Dropdown, Input, Menu, Modal } from "@arco-design/web-react";
import {
  IconApps,
  IconCalendar,
  IconCheck,
  IconDown,
  IconExport,
  IconHome,
  IconInfoCircle,
  IconLocation,
  IconRight,
  IconSearch,
  IconTag,
  IconUser,
} from "@arco-design/web-react/icon";
import clsx from "clsx";
import { useState } from "react";
import { logout as logoutRequest } from "@/api/auth";
import brandLogo from "@/assets/brand/wordmark.png";
import { formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";
import { AboutUsModal } from "@/components/layouts/AboutUsModal";

const MOCK_REGION = { value: "guangzhou-a", label: "广州-A" };

interface TopNavProps {
  activeKey: string;
  productPanelVisible: boolean;
  onProductPanelVisibleChange: (visible: boolean) => void;
}

export function TopNav({
  activeKey,
  productPanelVisible,
  onProductPanelVisibleChange,
}: TopNavProps) {
  const navigate = useNavigate();
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [regionMenuVisible, setRegionMenuVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const clear = useAuthStore((s) => s.clear);
  const username = useAuthStore(
    (s) => (s.hasKnownUsername ? s.username : null) ?? (s.developmentBypass ? "admin" : "用户"),
  );
  const sessionIssuedAt = useAuthStore((s) => {
    if (!s.tokens || !("issued_at" in s.tokens)) return null;
    return typeof s.tokens.issued_at === "string" ? s.tokens.issued_at : null;
  });

  const logout = useMutation({
    meta: {
      feedback: {
        channel: "notification",
        id: "logout",
        action: "操作",
        errorFallback: "操作失败，请稍后重试",
      },
    },
    mutationFn: async () => {
      const jti = useAuthStore.getState().getAccessTokenJti();
      if (!jti) throw new Error("当前 access token 缺少 jti，无法调用服务端登出");
      const submitData = { jti };
      await logoutRequest(submitData);
    },
    onSettled: () => {
      clear();
      navigate({ to: "/login" });
    },
  });

  const confirmLogout = () => {
    setUserMenuVisible(false);
    Modal.confirm({
      title: "确认退出登录",
      content: "退出后需重新登录。",
      okButtonProps: { status: "danger" },
      onOk: () => logout.mutateAsync(),
    });
  };

  const userMenu = (
    <div className="topnav-user-card" role="menu" aria-label="个人中心">
      <div className="topnav-user-card-header">
        <span className="topnav-user-card-avatar" aria-hidden="true">
          <IconUser />
        </span>
        <div className="topnav-user-card-profile">
          <strong>{username}</strong>
          <span className="topnav-user-card-meta">
            <IconTag />
            <span>console</span>
          </span>
          <span className="topnav-user-card-meta">
            <IconCalendar />
            <span>{formatDateTime(sessionIssuedAt)}</span>
          </span>
        </div>
      </div>
      <div className="topnav-user-card-menu">
        <span className="topnav-user-card-divider" aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          className="topnav-user-card-action"
          onClick={() => {
            setUserMenuVisible(false);
            setAboutVisible(true);
          }}
        >
          <IconInfoCircle />
          <span className="topnav-user-card-action-label">关于我们</span>
          <IconRight className="topnav-user-card-action-arrow" />
        </button>
      </div>
      <div className="topnav-user-card-footer">
        <button
          type="button"
          role="menuitem"
          className="topnav-user-card-logout"
          onClick={confirmLogout}
        >
          <IconExport />
          <span>安全退出</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className="top-nav h-(--topnav-height) basis-(--topnav-height)">
        <div className="topnav-left">
          <Link
            to="/"
            className="flex shrink-0 items-center rounded"
            aria-label="常青云，返回控制台首页"
            title="返回控制台首页"
            onClick={() => onProductPanelVisibleChange(false)}
          >
            <img src={brandLogo} alt="常青云" className="block h-[25px] w-auto" />
          </Link>
          <nav className="topnav-primary" aria-label="主导航">
            <button
              type="button"
              className={clsx("topnav-primary-item", activeKey === "/" && "is-active")}
              onClick={() => {
                onProductPanelVisibleChange(false);
                navigate({ to: "/" });
              }}
            >
              <IconHome />
              <span>概览</span>
            </button>
            <button
              type="button"
              className={clsx(
                "topnav-primary-item",
                (activeKey === "products" || productPanelVisible) && "is-active",
              )}
              aria-expanded={productPanelVisible}
              aria-controls="product-services-panel"
              onClick={() => onProductPanelVisibleChange(!productPanelVisible)}
            >
              <IconApps />
              <span>产品与服务</span>
            </button>
            <Dropdown
              trigger="click"
              position="bl"
              popupVisible={regionMenuVisible}
              onVisibleChange={setRegionMenuVisible}
              droplist={
                <Menu
                  aria-label="选择区域"
                  selectedKeys={[MOCK_REGION.value]}
                  onClickMenuItem={() => setRegionMenuVisible(false)}
                >
                  <Menu.Item key={MOCK_REGION.value}>
                    <span className="flex min-w-28 items-center justify-between gap-4">
                      <span>{MOCK_REGION.label}</span>
                      <IconCheck aria-hidden="true" />
                    </span>
                  </Menu.Item>
                </Menu>
              }
            >
              <Button
                type="text"
                className="topnav-primary-item topnav-region"
                style={{ cursor: "pointer" }}
                aria-label={`选择区域，当前区域：${MOCK_REGION.label}`}
                aria-haspopup="menu"
                aria-expanded={regionMenuVisible}
              >
                <IconLocation />
                <span>{MOCK_REGION.label}</span>
                <IconDown
                  className="topnav-region-arrow"
                  style={{ transform: regionMenuVisible ? "rotate(180deg)" : undefined }}
                />
              </Button>
            </Dropdown>
          </nav>
        </div>
        <div className="topnav-right">
          <Input
            className="topnav-search"
            prefix={<IconSearch />}
            placeholder="请输入内容"
            aria-label="全局搜索"
          />
          <button type="button" className="topnav-kaiwu" aria-label="进入开物">
            <span className="topnav-kaiwu-switch" aria-hidden="true">
              <span className="topnav-kaiwu-knob" />
            </span>
            <span>开物</span>
          </button>
          <span className="topnav-user-divider" aria-hidden="true" />
          <Dropdown
            droplist={userMenu}
            trigger="hover"
            position="br"
            popupVisible={userMenuVisible}
            onVisibleChange={setUserMenuVisible}
            triggerProps={{ mouseEnterDelay: 0, mouseLeaveDelay: 200 }}
          >
            <button
              type="button"
              className="topnav-user"
              aria-label={`打开 ${username} 用户菜单`}
              aria-haspopup="menu"
              aria-expanded={userMenuVisible}
            >
              <span className="topnav-user-avatar">
                <IconUser />
              </span>
              <span className="topnav-user-name">{username}</span>
            </button>
          </Dropdown>
        </div>
      </header>
      {aboutVisible && <AboutUsModal onCancel={() => setAboutVisible(false)} />}
    </>
  );
}
